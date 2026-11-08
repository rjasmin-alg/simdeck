#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Generate docs/tasks/ (one self-contained task per simulator) from docs/catalogue.md.

  tasks.py            write docs/tasks/**; a task whose Model section was filled in keeps its Sources and Model
  tasks.py --force    overwrite everything, filled sections too

The catalogue stays the source of truth for titles, concepts, sizes and priorities. This script adds the
wave, the sim folder id, topic and tags, dependencies, sources and the adoption steps.
"""
import json
import glob
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import ranker  # noqa: E402

REPO = Path(__file__).resolve().parents[2]
OUT = REPO / "docs" / "tasks"
P = os.path.expanduser("~/projects")
FILLED_MARK = "<!-- model: filled -->"

# ---------------------------------------------------------------- waves

CORE = [
    ("DNS", ["inet-dns-resolution", "inet-dns-records", "win-dns-zone-types", "win-dns-srv-records", "win-dns-dynamic-update"]),
    ("DHCP", ["net-dhcp-dora", "win-dhcp-scope-options"]),
    ("Active Directory", ["win-ad-structure", "win-group-scopes", "win-dc-promotion", "win-domain-join",
                          "win-domain-logon", "win-kerberos", "win-ad-replication"]),
    ("Group Policy", ["win-gpo-precedence", "win-gpo-processing"]),
    ("IPAM", ["win-ipam-address-plan"]),
    ("WSUS", ["win-wsus-flow"]),
    ("Windows files and identity", ["win-ntfs-share-effective", "win-access-token"]),
    ("Network fundamentals", ["net-encapsulation", "net-arp-local-remote", "net-hop-rewrite", "net-stp",
                              "net-rule-first-match", "net-ipv6-slaac", "net-port-multiplexing", "net-tcp-retransmit",
                              "net-tcp-congestion", "net-wifi-association", "net-wpa-handshake"]),
    ("Internet protocols", ["inet-http-exchange", "inet-tls-handshake", "inet-cert-chain", "inet-email-path",
                            "inet-ssh-key-auth", "inet-ntp-sync", "inet-bgp-path-selection"]),
    ("Security foundations", ["sec-sym-vs-asym", "sec-diffie-hellman", "sec-hash-properties", "sec-digital-signature"]),
    ("Linux foundations", ["lnx-pipes-redirection", "lnx-links-inodes", "lnx-permissions-rwx", "lnx-boot-chain",
                           "lnx-systemd-ordering", "lnx-mount-layers", "lnx-log-path", "lnx-routing-decision",
                           "lnx-shell-quoting", "lnx-selinux-decision", "lnx-namespaces", "lnx-overlayfs-layers",
                           "lnx-netfilter-path", "lnx-cow-filesystem", "lnx-lvm-extend"]),
    ("Storage and backup", ["sto-dedup-chunking", "sto-backup-diff-incr", "sto-backing-chains", "dr-rpo-rto"]),
    ("Replication and HA", ["ha-multimaster-conflict", "ha-quorum-split-brain", "ha-db-replication"]),
    ("Performance", ["perf-utilisation-latency"]),
]
CORE_GROUP = {cid: g for g, ids in CORE for cid in ids}
CORE_ORDER = {cid: i for i, cid in enumerate(cid for _, ids in CORE for cid in ids)}

# Pilots run first in wave 2: each is the first user of a shared view the kit then extracts (wave 2a).
PILOTS = {
    "net-dhcp-dora": "K1 message sequence chart",
    "net-arp-local-remote": "K2 topology with moving packets",
    "sto-dedup-chunking": "K3 block grid",
    "net-rule-first-match": "K4 rule table with the matching row",
}

# A preset task adds a preset (and its strings) to another sim's folder: hard dependency, one at a time per host.
PRESET_OF = {
    "net-broadcast-storm": "net-stp", "net-tcp-teardown": "urm-tcp-handshake",
    "inet-dns-split-brain": "inet-dns-secondary-expiry", "sec-pki-revocation": "inet-cert-chain",
    "inet-acme-renewal": "inet-cert-chain", "win-hyperv-checkpoints": "sto-backing-chains",
    "sto-cow-vs-row": "lnx-cow-filesystem", "win-vss": "lnx-cow-filesystem",
    "lnx-send-receive": "sto-backup-diff-incr", "sto-sync-async-replication": "ha-db-replication",
    "win-failover-cluster": "ha-quorum-split-brain", "ha-fencing": "ha-quorum-split-brain",
    "ham-fec-hamming": "net-crc", "win-firewall-profiles": "lnx-firewalld-zones", "win-boot": "lnx-boot-chain",
    "win-services": "lnx-systemd-ordering", "lnx-container-ports": "net-port-forwarding",
    "win-update-rings": "win-wsus-groups", "dr-correlated-failure": "app-faultline",
    "ha-never-zero-spof": "app-faultline",
}

# Soft dependency: start after this sim is merged, and reuse its model (copied, see COMMON.md §6).
BUILDS_ON = {
    "net-osi-tcpip-map": "net-encapsulation", "net-nominal-vs-actual": "net-delay-components",
    "net-ethernet-frame": "net-encapsulation", "net-domains": "urm-mac-table", "net-mac-flooding": "urm-mac-table",
    "net-vlan-trunk": "urm-vlan", "net-intervlan-routing": "urm-vlan", "net-arp-spoofing": "net-arp-local-remote",
    "net-ipv4-header": "net-hop-rewrite", "net-traceroute": "net-hop-rewrite", "net-icmp-messages": "net-hop-rewrite",
    "net-fragmentation-pmtud": "net-hop-rewrite", "net-route-summarisation": "urm-routing-table",
    "net-static-default-route": "urm-routing-table", "net-distance-vector": "urm-routing-table",
    "net-ipv6-ndp": "net-ipv6-slaac", "net-ipv6-address-types": "net-ipv6-slaac", "net-dhcp-relay": "net-dhcp-dora",
    "net-dhcp-rogue": "net-dhcp-dora", "net-port-forwarding": "urm-pat", "net-cgnat": "urm-nat",
    "net-tcp-states": "net-tcp-retransmit", "net-tcp-vs-udp-loss": "net-tcp-retransmit",
    "net-syn-outcomes": "urm-tcp-handshake", "net-asymmetric-path": "urm-firewall",
    "net-csma-ca-rts-cts": "urm-hidden-node", "net-wifi-roaming": "net-wifi-association",
    "net-packet-journey": "net-encapsulation",
    "inet-dns-ttl-cache": "inet-dns-resolution", "inet-dns-secondary-expiry": "inet-dns-records",
    "inet-dnssec-chain": "inet-dns-resolution", "inet-dns-poisoning": "inet-dns-resolution",
    "inet-http-versions": "inet-http-exchange", "inet-http-caching": "inet-http-exchange",
    "inet-cookies-sessions": "inet-http-exchange", "inet-cors": "inet-http-exchange",
    "inet-reverse-proxy-lb": "inet-http-exchange", "inet-cdn-anycast": "inet-bgp-path-selection",
    "inet-email-auth": "inet-email-path", "inet-smtp-dialogue": "inet-email-path",
    "inet-ftp-active-passive": "urm-nat", "inet-ssh-tunnels": "inet-ssh-key-auth",
    "inet-bgp-hijack": "inet-bgp-path-selection", "inet-peering-transit": "inet-bgp-path-selection",
    "inet-oauth-flow": "inet-http-exchange", "inet-websocket": "inet-http-exchange",
    "sec-password-storage": "sec-hash-properties", "sec-dmz-matrix": "urm-firewall",
    "sec-ransomware-321": "sto-backup-diff-incr", "sec-xss": "inet-http-exchange",
    "sec-wireguard": "sec-diffie-hellman", "sec-ipsec-ike": "sec-diffie-hellman",
    "sec-lateral-movement": "win-ntlm-vs-kerberos",
    "lnx-access-decision": "lnx-permissions-rwx", "lnx-special-bits": "lnx-permissions-rwx",
    "lnx-job-control": "lnx-signals", "lnx-timers-cron": "lnx-systemd-ordering",
    "lnx-partition-tables": "lnx-mount-layers", "lnx-disk-full-mysteries": "lnx-links-inodes",
    "lnx-logrotate": "lnx-log-path", "lnx-firewalld-zones": "lnx-netfilter-path",
    "lnx-exit-status": "lnx-pipes-redirection", "lnx-subshell-trap": "lnx-shell-quoting",
    "lnx-nfs-root-squash": "lnx-permissions-rwx", "lnx-cgroups": "lnx-namespaces",
    "lnx-container-volumes": "lnx-overlayfs-layers", "lnx-userns-mapping": "lnx-namespaces",
    "lnx-netns-veth-bridge": "lnx-namespaces", "lnx-policy-routing": "lnx-routing-decision",
    "lnx-bonding-modes": "net-link-aggregation", "lnx-lvm-snapshot": "lnx-lvm-extend",
    "lnx-thin-overcommit": "lnx-lvm-extend", "lnx-zfs-self-heal": "lnx-cow-filesystem",
    "win-ou-vs-group": "win-ad-structure", "win-account-lockout": "win-domain-logon",
    "win-ntlm-vs-kerberos": "win-kerberos", "win-time-hierarchy": "win-kerberos",
    "win-ad-sites": "win-ad-replication", "win-sysvol-dfsr": "win-ad-replication", "win-rodc": "win-ad-sites",
    "win-fsmo-roles": "win-ad-structure", "win-functional-levels": "win-ad-structure",
    "win-fgpp": "win-gpo-precedence", "win-delegation": "win-ad-structure", "win-trusts": "win-kerberos",
    "win-ad-recycle-bin": "win-ad-replication", "win-ad-backup-restore": "win-ad-replication",
    "win-gpo-security-filtering": "win-gpo-precedence", "win-gpo-loopback": "win-gpo-precedence",
    "win-gpo-tattooing": "win-gpo-processing", "win-gpo-targeting": "win-gpo-tattooing",
    "win-gpo-software-install": "win-gpo-processing", "win-gpo-slow-link": "win-gpo-processing",
    "win-admx-store": "win-gpo-precedence", "win-dns-forwarders": "inet-dns-resolution",
    "win-dns-client-order": "inet-dns-resolution", "win-dns-scavenging": "win-dns-dynamic-update",
    "win-dns-policies": "win-dns-zone-types", "win-dhcp-authorization": "net-dhcp-dora",
    "win-dhcp-dns-update": "win-dns-dynamic-update", "win-dhcp-failover": "win-dhcp-scope-options",
    "win-dhcp-policies": "win-dhcp-scope-options", "win-dhcp-superscope": "win-dhcp-scope-options",
    "win-ipam-discovery": "win-ipam-address-plan", "win-ipam-utilisation": "win-ipam-address-plan",
    "win-ipam-audit": "win-ipam-address-plan", "win-ipam-reconcile": "win-ipam-address-plan",
    "win-wsus-groups": "win-wsus-flow", "win-wsus-client-cycle": "win-wsus-flow",
    "win-wsus-cloned-id": "win-wsus-flow", "win-wsus-supersedence": "win-wsus-flow",
    "win-wsus-delivery": "win-wsus-flow", "win-ntfs-inheritance": "win-ntfs-share-effective",
    "win-uac": "win-access-token", "win-powershell-objects": "lnx-pipes-redirection",
    "win-smb-session": "win-kerberos", "win-dfs": "inet-dns-resolution", "win-bitlocker-tpm": "lnx-boot-chain",
    "win-laps": "sec-lateral-movement",
    "win-domain-logon": "win-dns-srv-records", "win-dns-srv-records": "win-dc-promotion",
    "sto-dedup-file-funnel": "sto-dedup-chunking", "sto-retention-gfs": "sto-backup-diff-incr",
    "sto-restore-drill": "sto-backup-diff-incr", "sto-backup-window": "sto-backup-diff-incr",
    "sto-iops-latency": "perf-utilisation-latency", "sto-ceph-min-size": "ha-quorum-split-brain",
    "sto-ceph-down-out": "sto-ceph-min-size", "sto-crush-failure-domain": "sto-ceph-min-size",
    "sto-smallest-disk-caps": "sto-ceph-min-size", "dr-site-failover": "dr-rpo-rto",
    "ha-vrrp-failover": "net-arp-local-remote", "ha-cap": "ha-db-replication", "ha-raft": "ha-quorum-split-brain",
    "win-ad-replication": "ha-multimaster-conflict",
    "perf-littles-law": "perf-utilisation-latency", "perf-tail-latency": "perf-utilisation-latency",
    "perf-retry-storm": "perf-utilisation-latency", "perf-goodhart-teams": "perf-utilisation-latency",
    "perf-autoscaling-lag": "perf-utilisation-latency",
    "arh-mesi": "spl-multicore-mesi", "aut-regex-to-nfa": "spl-automata", "ham-qam-ofdm": "50ohm-qpsk",
    "ham-ionosphere-muf": "50ohm-skip-distance", "kk-priority-traffic": "kk-directed-net",
    "kk-backup-ncs": "kk-directed-net", "kk-gateway-tiers": "kk-directed-net",
    # finance (§4.12): the discounting and the ledger (cash, expense, book value by month) are shared, §5.23
    "fin-roi-payback-npv": "fin-npv-discounting", "fin-lease-vs-buy": "fin-npv-discounting",
    "fin-prepay-discount": "fin-npv-discounting", "fin-accruals-cash": "fin-capex-opex",
    "fin-depreciation": "fin-capex-opex", "fin-licence-models": "fin-capex-opex",
    "fin-budget-variance": "fin-accruals-cash", "fin-refresh-cycle": "fin-depreciation",
    "fin-sunk-cost": "fin-depreciation", "fin-chargeback": "fin-fixed-variable",
    # compliance (§4.13): people × roles × rights, risk scoring, incident clocks and the evidence trail are shared, §5.24
    "cmp-sod-toxic": "cmp-jml-drift", "cmp-privileged-access": "cmp-jml-drift",
    "cmp-dpia-triage": "cmp-risk-register", "cmp-vendor-tiers": "cmp-risk-register",
    "cmp-exceptions": "cmp-risk-register", "cmp-cost-of-noncompliance": "fin-ale-risk",
    "cmp-breach-triage": "cmp-incident-clocks", "cmp-audit-sampling": "cmp-policy-to-record",
    "cmp-restore-evidence": "cmp-policy-to-record", "cmp-data-subject-request": "cmp-retention-hold",
    # film set (§4.14): crew and chain, floor plan, forces and moments, shooting day and electrical load are shared, §5.25
    "set-chain-of-command": "set-stop-for-safety", "set-who-touches-what": "set-stop-for-safety",
    "set-exclusion-zone": "set-cable-runs-exits", "set-emergency-response": "set-cable-runs-exits",
    "set-working-at-height": "set-cable-runs-exits", "set-picture-vehicles": "set-exclusion-zone",
    "set-working-load": "set-stand-tipping", "set-manual-handling": "set-stand-tipping",
    "set-continuity": "set-call-sheet", "set-hearing": "set-call-sheet", "set-phase-balance": "set-circuit-load",
}

# ---------------------------------------------------------------- sim folder ids

STRIP = ("net-", "inet-", "sec-", "sto-", "dr-", "ha-", "perf-", "arh-", "aut-", "ham-", "kk-", "ref-", "tool-",
         "spl-", "urm-", "ossim-", "50ohm-", "app-")
SIM_ID_OVERRIDE = {
    "spl-lvm-lab": "lvm-topology", "lnx-partition-tables": "disk-partitioning", "ossim-map": "os-map",
    "urm-window": "tcp-window", "urm-firewall": "stateful-firewall", "50ohm-rectangle": "rect-pulse-spectrum",
    "50ohm-sine": "sine-amplitude-period", "50ohm-am": "am-modulation", "50ohm-pm": "phase-modulation",
    "50ohm-iq": "iq-signals", "50ohm-dsp": "dsp-basics", "50ohm-traps": "trap-antenna",
    "50ohm-interference": "multipath-interference", "50ohm-fading": "fading", "app-dc-sim": "dc-sim",
    "app-dr-estate": "dr-estate", "ref-ports": "well-known-ports", "ref-http-status": "http-status-codes",
    "tool-countdown": "countdown", "tool-quick-poll": "quick-poll", "spl-automata": "automata",
    "ossim-sync": "synchronization", "ossim-journey": "os-call-journey", "arh-mesi": "mesi-coherence",
    "ham-shannon": "shannon-hartley", "net-crc": "crc-error-detection", "sec-xss": "xss",
    "ha-cap": "cap-under-partition", "ha-raft": "raft", "inet-cors": "cors",
}


def sim_id(cid):
    if cid in SIM_ID_OVERRIDE:
        return SIM_ID_OVERRIDE[cid]
    for p in STRIP:
        if cid.startswith(p):
            return cid[len(p):]
    return cid


# ---------------------------------------------------------------- topic and tags

def topic_of(cid, area):
    pre = cid.split("-")[0]
    special = {
        "ref-ports": "networks", "ref-http-status": "internet", "ref-protocol-headers": "networks",
        "ref-linux-dirs": "linux-admin", "spl-l2l3-protocols": "networks", "spl-automata": "theory",
        "spl-dfa-game": "theory", "spl-lvm-lab": "storage", "spl-stratis-lab": "storage",
        "spl-zfs-btrfs-lab": "storage", "spl-student-picker": "classroom", "app-topologydrafter": "networks",
        "app-cephsim": "storage", "app-faultline": "distributed", "sto-ssd-internals": "storage",
    }
    if cid in special:
        return special[cid]
    if cid.startswith("spl-"):
        return "radio" if any(k in cid for k in ("radio", "rf", "comms", "lora", "ham")) else "architecture"
    return {
        "net": "networks", "urm": "networks", "inet": "internet", "sec": "security", "lnx": "linux-admin",
        "win": "windows-admin", "sto": "storage", "dr": "storage", "ha": "distributed", "perf": "distributed",
        "arh": "architecture", "os": "os", "ossim": "os", "aut": "theory", "ham": "radio", "kk": "radio",
        "50ohm": "radio", "tool": "classroom", "app": "distributed", "fin": "finance",
        "cmp": "compliance", "set": "film-set",
    }.get(pre, "networks")


TAG_RULES = [
    ("flow-control", "tcp"), ("urm-window", "tcp"), ("port-multiplexing", "tcp"), ("ftp", "nat"),
    ("game-tick", "performance"),
    ("dns", "dns"), ("dhcp", "dhcp"), ("kerberos", "kerberos"), ("ntlm", "authentication"), ("gpo", "group-policy"),
    ("admx", "group-policy"), ("fgpp", "group-policy"), ("win-ad-", "active-directory"), ("win-dc-", "active-directory"),
    ("win-domain", "active-directory"), ("win-group", "active-directory"), ("win-ou", "active-directory"),
    ("win-fsmo", "active-directory"), ("win-rodc", "active-directory"), ("win-trusts", "active-directory"),
    ("win-delegation", "active-directory"), ("win-functional", "active-directory"), ("win-sysvol", "active-directory"),
    ("win-account-lockout", "active-directory"), ("win-time", "time-sync"), ("ntp", "time-sync"),
    ("wsus", "updates"), ("update-rings", "updates"), ("ipam", "ip-addressing"), ("ntfs", "permissions"),
    ("permissions", "permissions"), ("access", "permissions"), ("token", "permissions"), ("uac", "permissions"),
    ("special-bits", "permissions"), ("selinux", "selinux"), ("tcp", "tcp"), ("udp", "udp"), ("syn-", "tcp"),
    ("arp", "arp"), ("stp", "switching"), ("broadcast-storm", "switching"), ("mac", "switching"),
    ("domains", "switching"), ("vlan", "vlan"), ("ipv6", "ipv6"), ("route", "routing"), ("routing", "routing"),
    ("hop", "routing"), ("traceroute", "routing"), ("distance-vector", "routing"), ("link-state", "routing"),
    ("bgp", "bgp"), ("peering", "bgp"), ("anycast", "bgp"), ("nat", "nat"), ("pat", "nat"), ("port-forwarding", "nat"), ("cgnat", "nat"), ("layered-diagnosis", "troubleshooting"), ("asymmetric-path", "firewall"), ("dnssec", "dns"), ("logrotate", "logging"), ("consistent-hashing", "replication"),
    ("container-ports", "containers"), ("wifi", "wifi"), ("wpa", "wifi"), ("hidden-node", "wifi"),
    ("csma-ca", "wifi"), ("tls", "tls"), ("cert", "tls"), ("pki", "tls"), ("acme", "tls"), ("http", "http"),
    ("cors", "http"), ("cookies", "http"), ("websocket", "http"), ("reverse-proxy", "http"), ("cdn", "http"),
    ("email", "email"), ("smtp", "email"), ("ssh", "ssh"), ("firewall", "firewall"), ("netfilter", "firewall"),
    ("firewalld", "firewall"), ("dmz", "firewall"), ("rule-first-match", "firewall"), ("encapsulation", "encapsulation"),
    ("osi", "encapsulation"), ("ethernet", "ethernet"), ("csma-cd", "ethernet"), ("line-coding", "physical-layer"),
    ("delay", "physical-layer"), ("nominal", "physical-layer"), ("crc", "error-detection"), ("hamming", "error-detection"),
    ("icmp", "icmp"), ("fragmentation", "ip"), ("ipv4", "ip"), ("subnet", "ip-addressing"), ("vlsm", "ip-addressing"),
    ("summarisation", "ip-addressing"), ("address-plan", "ip-addressing"), ("multicast", "multicast"),
    ("qos", "qos"), ("link-aggregation", "link-aggregation"), ("bonding", "link-aggregation"), ("poe", "ethernet"),
    ("pipes", "shell"), ("quoting", "shell"), ("exit-status", "shell"), ("subshell", "shell"), ("regex", "shell"),
    ("powershell", "shell"), ("job-control", "processes"), ("signals", "processes"), ("links-inodes", "filesystems"),
    ("disk-full", "filesystems"), ("mount", "filesystems"), ("partition", "partitioning"), ("cow", "filesystems"),
    ("zfs", "filesystems"), ("send-receive", "snapshots"), ("mft", "filesystems"), ("lvm", "lvm"),
    ("thin", "lvm"), ("quotas", "filesystems"), ("raid", "raid"), ("mirror", "raid"), ("storage-spaces", "raid"),
    ("boot", "boot"), ("bitlocker", "boot"), ("systemd", "services"), ("services", "services"),
    ("timers", "services"), ("log", "logging"), ("namespaces", "containers"), ("cgroups", "containers"),
    ("overlayfs", "containers"), ("container", "containers"), ("userns", "containers"), ("netns", "containers"),
    ("hypervisor", "virtualization"), ("live-migration", "virtualization"), ("hyperv", "virtualization"),
    ("backing-chains", "snapshots"), ("vss", "snapshots"), ("snapshot", "snapshots"), ("dedup", "deduplication"),
    ("backup", "backup"), ("retention", "backup"), ("restore", "backup"), ("321", "backup"), ("rpo", "disaster-recovery"),
    ("site-failover", "disaster-recovery"), ("alert-to-nobody", "disaster-recovery"), ("correlated", "fault-tolerance"),
    ("spof", "fault-tolerance"), ("ceph", "storage-cluster"), ("crush", "storage-cluster"), ("ec-vs", "storage-cluster"),
    ("smallest-disk", "storage-cluster"), ("write-cache", "storage-basics"), ("ssd", "storage-basics"),
    ("iops", "storage-basics"), ("nas-vs-san", "storage-basics"), ("multipath", "storage-basics"),
    ("replication", "replication"), ("multimaster", "replication"), ("quorum", "fault-tolerance"),
    ("fencing", "fault-tolerance"), ("failover", "fault-tolerance"), ("vrrp", "fault-tolerance"),
    ("raft", "consensus"), ("cap", "consensus"), ("two-phase", "consensus"), ("lamport", "consensus"),
    ("consistent-hashing", "replication"), ("utilisation", "performance"), ("littles", "performance"),
    ("tail", "performance"), ("retry", "performance"), ("rate-limiting", "performance"), ("cache-hit", "performance"),
    ("goodhart", "performance"), ("autoscaling", "performance"), ("slo", "monitoring"), ("alert-states", "monitoring"),
    ("ansible", "automation"), ("terraform", "automation"), ("deploy", "automation"), ("pam", "authentication"),
    ("nfs", "file-sharing"), ("smb", "file-sharing"), ("dfs", "file-sharing"), ("rsync", "backup"),
    ("package", "packages"), ("page-cache", "memory"), ("memory", "memory"), ("load-average", "performance"),
    ("sym-vs-asym", "cryptography"), ("diffie", "cryptography"), ("hash", "cryptography"), ("signature", "cryptography"),
    ("ciphers", "cryptography"), ("password", "authentication"), ("mfa", "authentication"), ("aaa", "authentication"),
    ("laps", "authentication"), ("lateral", "attacks"), ("spoofing", "attacks"), ("poisoning", "attacks"),
    ("hijack", "attacks"), ("ddos", "attacks"), ("sql", "attacks"), ("xss", "attacks"), ("buffer-overflow", "attacks"),
    ("flooding", "attacks"), ("rogue", "attacks"), ("ransomware", "attacks"), ("wireguard", "vpn"), ("ipsec", "vpn"),
    ("oauth", "authentication"), ("registry", "windows-internals"), ("cache-mapping", "caches"), ("mesi", "caches"),
    ("pipeline", "cpu"), ("twos", "number-representation"), ("floating", "number-representation"),
    ("endianness", "number-representation"), ("context-switch", "processes"), ("regex-to-nfa", "automata"),
    ("automata", "automata"), ("dfa", "automata"), ("amdahl", "parallelism"), ("multicore", "parallelism"),
    ("sram", "memory"), ("rowhammer", "attacks"), ("spectre", "attacks"), ("l2l3", "encapsulation"),
    ("stratis", "filesystems"), ("radio", "radio-networks"), ("lora", "radio-networks"), ("rf-", "spectrum"),
    ("comms-poster", "spectrum"), ("ham-modes", "modulation"), ("student-picker", "classroom-tool"),
    ("countdown", "classroom-tool"), ("quick-poll", "classroom-tool"),
    ("superhet", "receivers"), ("swr", "antennas"), ("ionosphere", "propagation"), ("multiple-access", "modulation"),
    ("qam", "modulation"), ("shannon", "modulation"), ("packet-aprs", "radio-networks"), ("fft", "signals"),
    ("ctcss", "receivers"), ("lora-css", "modulation"), ("fsk", "modulation"), ("adsb", "radio-networks"),
    ("kk-", "emergency-comms"), ("nyquist", "signals"), ("quantisation", "signals"), ("fourier", "signals"),
    ("rectangle", "signals"), ("sine", "signals"), ("lambda", "signals"), ("50ohm-am", "modulation"),
    ("50ohm-pm", "modulation"), ("qpsk", "modulation"), ("iq", "modulation"), ("ring-modulator", "modulation"),
    ("speech", "signals"), ("dsp", "signals"), ("chirp", "signals"), ("lc-", "circuits"), ("traps", "antennas"),
    ("attenuator", "circuits"), ("rectifier", "circuits"), ("ripple", "circuits"), ("interference", "propagation"),
    ("fading", "propagation"), ("skip", "propagation"), ("greyline", "propagation"), ("aurora", "propagation"),
    ("maidenhead", "radio-networks"), ("aprs", "radio-networks"), ("hamnet", "radio-networks"),
    ("ossim-", "operating-systems"), ("os-", "operating-systems"), ("topologydrafter", "topology"),
    ("cephsim", "storage-cluster"), ("faultline", "fault-tolerance"), ("ports", "tcp"), ("http-status", "http"),
    ("linux-dirs", "filesystems"), ("protocol-headers", "encapsulation"), ("wifi-channels", "wifi"),
    ("journey", "encapsulation"), ("osi-tcpip", "encapsulation"), ("peering", "bgp"),
]


TAGS_OVERRIDE = {"win-ntfs-mft": ["filesystems"], "ham-multiple-access": ["modulation"],
    "fin-capex-opex": ["accounting", "budgeting"], "fin-depreciation": ["accounting"],
    "fin-refresh-cycle": ["costs", "accounting"], "fin-accruals-cash": ["accounting"],
    "fin-budget-variance": ["budgeting"], "fin-tco": ["costs"], "fin-npv-discounting": ["investment"],
    "fin-roi-payback-npv": ["investment"], "fin-fixed-variable": ["costs"],
    "fin-chargeback": ["costs", "budgeting"], "fin-cloud-commitment": ["costs", "contracts"],
    "fin-lease-vs-buy": ["investment", "contracts"], "fin-licence-models": ["contracts", "costs"],
    "fin-prepay-discount": ["contracts", "investment"], "fin-indexation-fx": ["contracts"],
    "fin-contingency-reserve": ["budgeting", "risk"], "fin-downtime-cost": ["risk", "costs"],
    "fin-ale-risk": ["risk"], "fin-sunk-cost": ["investment"], "fin-cost-of-delay": ["investment"],
    "cmp-policy-to-record": ["governance", "audit"], "cmp-audit-sampling": ["audit"],
    "cmp-risk-register": ["risk", "governance"], "cmp-change-risk-class": ["change-management"],
    "cmp-jml-drift": ["identity-governance", "permissions"], "cmp-sod-toxic": ["identity-governance", "audit"],
    "cmp-four-eyes": ["audit", "governance"], "cmp-privileged-access": ["identity-governance", "permissions"],
    "cmp-log-evidence": ["logging", "audit"], "cmp-patch-sla": ["updates", "risk"],
    "cmp-dpia-triage": ["data-protection", "risk"], "cmp-retention-hold": ["data-protection", "backup"],
    "cmp-data-subject-request": ["data-protection"], "cmp-breach-triage": ["data-protection", "incident-response"],
    "cmp-nis2-scope": ["governance"], "cmp-incident-clocks": ["incident-response", "data-protection"],
    "cmp-bia": ["disaster-recovery", "risk"], "cmp-restore-evidence": ["backup", "audit", "disaster-recovery"],
    "cmp-vendor-tiers": ["risk", "governance"], "cmp-shared-responsibility": ["governance", "risk"],
    "cmp-exceptions": ["governance", "risk"], "cmp-maturity-levels": ["governance"],
    "cmp-cost-of-noncompliance": ["risk", "governance"],
    "set-stop-for-safety": ["set-safety", "set-roles"], "set-circuit-load": ["electrical-safety", "fire-safety"],
    "set-stand-tipping": ["rigging", "set-safety"], "set-cable-runs-exits": ["fire-safety", "set-safety"],
    "set-exclusion-zone": ["specialist-hazards", "set-safety"], "set-fatigue-turnaround": ["occupational-health"],
    "set-chain-of-command": ["set-roles"], "set-who-touches-what": ["set-roles"],
    "set-calls-sequence": ["set-procedure"], "set-setup-cycle": ["set-procedure", "set-roles"],
    "set-radio-discipline": ["set-procedure"], "set-call-sheet": ["set-procedure"],
    "set-card-handoff": ["set-procedure", "backup"], "set-risk-controls": ["set-safety", "risk"],
    "set-emergency-response": ["set-safety"], "set-working-at-height": ["working-at-height"],
    "set-lamp-heat": ["fire-safety", "electrical-safety"], "set-continuity": ["set-procedure"],
    "set-working-load": ["rigging"], "set-picture-vehicles": ["specialist-hazards"],
    "set-manual-handling": ["occupational-health"], "set-phase-balance": ["electrical-safety"],
    "set-hearing": ["occupational-health"], "set-weather-lightning": ["set-safety", "occupational-health"],
    "set-boom-shadow": ["set-roles", "set-procedure"]}


def tags_of(cid):
    """Tags from whole hyphen-separated words of the id ("signature" does not contain the word "nat")."""
    if cid in TAGS_OVERRIDE:
        return TAGS_OVERRIDE[cid]
    tags = []
    for key, tag in TAG_RULES:
        hit = re.search(rf"(^|-){re.escape(key.strip('-'))}(-|$)", cid)
        if hit and tag not in tags:
            tags.append(tag)
        if len(tags) == 3:
            break
    return tags or ["networking"]


ADOPT_COURSES = {
    "spl-amdahl": "ARH", "spl-webserver-amdahl": "ARH", "spl-multicore-mesi": "ARH", "spl-sram-dram": "ARH",
    "spl-rowhammer": "ARH, SEC", "spl-spectre-meltdown": "ARH, SEC", "spl-l2l3-protocols": "URM, NLA",
    "spl-automata": "AUT", "spl-dfa-game": "AUT", "spl-lvm-lab": "UL, NLA", "spl-stratis-lab": "NLA",
    "spl-zfs-btrfs-lab": "NLA", "spl-radio-security-slides": "HAM, SEC", "spl-radio-security-page": "HAM, SEC",
    "spl-rf-bandplan": "HAM", "spl-comms-poster": "HAM, URM", "spl-radio-networks": "HAM, KK",
    "spl-lora-mesh": "HAM, KK", "spl-ham-modes": "HAM", "spl-student-picker": "all (tool)",
    "app-topologydrafter": "URM, WIN1, WIN2", "app-cephsim": "NLA, DR", "app-faultline": "DR, NLA",
}

def level_of(courses):
    """sim.json level from the courses: intro courses first, then advanced ones (owner may override)."""
    if re.search(r"\b(FIN|CMP|SET)\b", courses):
        return "intro"
    if re.search(r"\b(URM|UL|WIN1|AUT)\b", courses):
        return "intro"
    if re.search(r"\b(NLA|WIN2|DR)\b", courses):
        return "advanced"
    return "core"


CLASS = {"step": "stepper", "expl": "explorer", "ref": "reference", "tool": "tool"}

# ---------------------------------------------------------------- sources

UL = f"{P}/uvod-u-linux"
URM = f"{P}/uvod-u-racunalne-mreze"
NLA = f"{P}/napredna-linux-administracija"
DRE = f"{P}/dr-lecture-estate"
OHM = f"{P}/50ohm-contents-hr/contents"


def chapter(book, n):
    hits = sorted(glob.glob(f"{book}/book/chapters/{int(n):02d}-*.md"))
    return hits[0] if hits else f"{book}/book/chapters/{int(n):02d}-*.md"


def sources_of(seed):
    out = []
    for m in re.finditer(r"\bUL ch(\d+)", seed):
        out.append(f"`{chapter(UL, m.group(1))}` (Uvod u Linux) and its diagrams in "
                   f"`{UL}/assets/diagrams/chapter-{int(m.group(1)):02d}/`")
    for m in re.finditer(r"\bURM (?:card )?ch(\d+)", seed):
        out.append(f"`{chapter(URM, m.group(1))}` (Uvod u računalne mreže) and `{URM}/assets/diagrams/ch{int(m.group(1)):02d}-*.svg`")
    if "URM card" in seed:
        out.append(f"`{URM}/meta/plan-interaktivne-stranice.md` §6 (the planned card: {seed})")
    for m in re.finditer(r"\bNLA (T\d+(?:[–-]\d+)?)", seed):
        out.append(f"`{NLA}/meta/toc.md`, topic {m.group(1)} (Napredna Linux administracija; chapters not written yet)")
    for m in re.finditer(r"\bDR (S\d+)", seed):
        out.append(f"`{DRE}/student/scenarios/{m.group(1)}.md` (DR estate scenario)")
    for m in re.finditer(r"\bDR caveat (CV-\d+)", seed):
        out.append(f"`{DRE}/instructor/caveats.md` {m.group(1)} (instructor only: never quote it on a student page)")
    if "dc-sim" in seed:
        out.append(f"`{P}/dc-sim/docs/concepts.md`, `{P}/dc-sim/scenarios/` (Python reference model; its acceptance tests give expected numbers)")
    if "cephsim" in seed:
        out.append(f"`{P}/cephsim/js/engine/` (pure CRUSH/PG engine) and `{P}/cephsim/js/samples.js`")
    if "faultline" in seed:
        out.append(f"`{P}/faultline/js/engine/`, `{P}/faultline/js/samples.js`, `{P}/faultline/PEDAGOGY.md`")
    if "scoping note" in seed:
        out.append(f"`{P}/cluster-design-sim-scoping.md` §5")
    if "filesearcher" in seed:
        out.append(f"`{P}/filesearcher/idea.md`")
    if "agentvsagent" in seed:
        out.append(f"`{P}/agentvsagent/engine.py`, `{P}/agentvsagent/spectator.html`")
    if "HamMonitor" in seed:
        out.append(f"`{P}/HamMonitor/DESIGN.md`")
    if "KK" in seed:
        out.append(f"`{P}/KAKA/` (KK1/KK2 slides, operating handbook)")
    if "topologydrafter" in seed:
        out.append(f"`{P}/topologydrafter/js/samples.js` (sample `two-sites`: AD multi-site with RODC)")
    for m in re.finditer(r"50ohm `([^`]+)`", seed):
        for name in re.split(r"`, `", m.group(1)):
            out.append(f"`{OHM}/sections/{name.replace('*', '')}*.md` (50ohm, CC BY 4.0)")
    if "ossim" in seed:
        out.append(f"`{P}/ossimulator/src/modules/` (the matching ossimulator page)")
    if "spl-l2l3" in seed:
        out.append(f"`{P}/single-page-labs/l2l3-protocols.html`")
    if "proposal first batch" in seed:
        out.append("`docs/proposal-simdeck.md` (first batch) and `docs/playbook.md` §10.8")
    return out


# ---------------------------------------------------------------- adoption

def adopt_source(cid, row):
    where = ranker.plain(row.get("Where", "") or row.get("Where (`ugradbeno/…`)", "") or row.get("Applet (`contents/html/…`)", ""))
    if cid.startswith("spl-"):
        return f"{P}/single-page-labs/{where}"
    if cid.startswith("urm-"):
        return f"{URM}/output/interaktivno/ugradbeno/{where}"
    if cid.startswith("50ohm-"):
        return f"{OHM}/html/{where}"
    if cid.startswith("ossim-"):
        page = cid[len("ossim-"):]
        return f"{P}/ossimulator/dist-single/{'index' if page == 'map' else page}.html (built from {P}/ossimulator/src/modules/{page}/)"
    return where


ADOPT_STEPS = {
    "spl": """1. Copy the page: `cp {src} sims/{sid}/index.html`. Set `origin` to `single-page-labs/{file}`.
2. Classify it as `{cls}` and write `sims/{sid}/sim.json` (all required fields, `status: "wip"`).
3. Adapt it to the kit (`docs/sim-ui.md`): kit tokens instead of the page's own palette, the kit header with
   back link and legend, the kit transport for its class, kit fonts instead of Google Fonts. Keep the page's
   model and wording; where it is a stepper, move the step logic into a DOM-free `sim.js` with `sim.test.js`.
4. Make it bilingual (COMMON.md §4). Today it is in {lang}; write the other language.
5. Remove every network load (fonts, CDN scripts): vendor or drop them. The build refuses network loads.
6. Record exceptions in the page's `#simdeck-exceptions` block instead of working around a rule silently.
7. Run the checks (COMMON.md §7) and look at the screenshots.""",
    "urm": """1. The source is a **fragment** of the URM book's web edition, not a page: it uses the book's
   `IA.Klizac` (slider) and `IA.Koraci` (steps) from `{urm}/output/interaktivno/static/komponente.js` and the
   book's CSS. Read the fragment, `komponente.js` and the book's §7a layout rules (`{urm}/scripts/check-web.py`).
2. Start from the template (`kit/new-sim.sh {sid} sims/{sid}`) and rebuild the fragment on the kit: its slider and
   steps become kit params and the kit step controller; its "what happened" box becomes the caption; its "why" box
   becomes the explanation; its exercises (`ia-zadatak`) become presets.
3. **Keep the book's numbers.** The comment at the top of the fragment names the worked example (chapter,
   Primjer N) the numbers come from; keep them as the first preset and cite them in `NOTES.md`.
4. Croatian is the original; write English (COMMON.md §4). Croatian terms follow the book's glossary.
5. `origin`: `uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/{file}`.
6. Run the checks (COMMON.md §7).""",
    "50ohm": """1. Copy `{src}` into `sims/{sid}/` as `index.html`. Set `origin` to `50ohm-contents-hr/contents/html/{file}`.
2. **Attribution (CC BY 4.0) is mandatory**: credit "50ohm.de-Autorenteam, AJW-Referat des DARC e.V.", link the
   licence, and state that the applet was changed (adapted to simdeck, translated). Put it in the page footer in
   both languages and in `NOTES.md`. Check the applet has no separate author or licence of its own; if it does,
   stop and report.
3. Vendor any library the applet loads from `50ohm.de` (jQuery 3.7.1, Chart.js 4.4.1, three.js, Leaflet: all
   MIT/BSD) into the sim folder with their licence headers. The build refuses network loads.
4. Adapt to the kit: tokens, header, transport for its class, kit fonts.
5. It is in Croatian (translated from German); write English (COMMON.md §4). The German original is
   `{P}/50ohm-contents-dl/contents/html/{file}`.
6. Run the checks (COMMON.md §7).""",
    "ossim": """1. Copy the built single file `{P}/ossimulator/dist-single/{page}.html` to `sims/{sid}/index.html`
   (rebuild it first with `npm run verify` in `{P}/ossimulator` if `src/` is newer than `dist-single/`).
   Set `origin` to `ossimulator/{page}`.
2. Do not adapt it to the kit: it has its own shared runtime and a full test suite. Add `data-sim="{sid}"` to
   its `<html>`, a `#simdeck-meta` placeholder and a `#simdeck-exceptions` block declaring `kit`, `text-size`
   (ossimulator's floor is 14 px) and `one-screen` (its six-section layout scrolls). These are the only edits to
   the built file.
3. Write `sim.json`: title, concept and summary from the page's `meta.ts`
   (`{P}/ossimulator/src/modules/{page}/meta.ts`), class `explorer`, topic `os`.
4. List the scenario deep links that index entries should use: {extra}. Each opens paused with
   `?scenario=<id>` (put them in `NOTES.md`; the frame does not have per-preset entries yet: see the
   foundation task about presets in the index).
5. **English** cannot be added to a built bundle: it is written in ossimulator's source (foundation task
   `ossimulator-english`, done in `93da8f8`). The build carries both languages (`?lang=`, else `simdeck.lang`), so
   `sim.json` has no `languages` field (t-0118).
6. Check that the single file runs from `file://` with the network blocked (ossimulator's own e2e does this).
7. **ossimulator is the source of truth** (owner, 2026-10-02): never fix this copy. A defect found here goes into
   ossimulator, and the build is re-imported.""",
    "app": """1. Copy the app's `index.html`, `css/` and `js/` into `sims/{sid}/` (keep `origin`: `{name}`).
2. The app uses ES modules that import each other. The simdeck build only inlines classic scripts and
   import-free modules (`docs/site-structure.md` §5), so bundle it once into one classic script at import
   time (write the one-off bundling command in `NOTES.md`; no new dependency without asking the coordinator).
3. Keep the app's own UI (declare `kit` and `one-screen` in `#simdeck-exceptions`); add `data-sim`, the
   `#simdeck-meta` placeholder and the kit header's back link only.
4. Expose its samples as presets in the URL: {deeplinks}.
5. It is in English; write Croatian (COMMON.md §4) in the copy. The simdeck copy is canonical from now on.
6. Run the app's own tests (`node tests/run.mjs` where present) against the copy, then the checks
   (COMMON.md §7). {extra}""",
}


# ---------------------------------------------------------------- catalogue

def load():
    text = (REPO / "docs" / "catalogue.md").read_text()
    rows = ranker.parse(text)
    clusters = {}
    for m in re.finditer(r"^\| (5\.\d+) \| \*\*([^*]+)\*\* \| (.*?) \| (.*?) \|$", text, re.M):
        for cid in re.findall(r"`([a-z0-9-]+)`", m.group(3)):
            clusters.setdefault(cid, []).append((m.group(1), m.group(2), m.group(4)))
    return rows, clusters


def esc(s):
    return s.replace("\\|", "|")


NOT_ADOPTED = ("app-dc-sim", "app-dr-estate", "50ohm-maidenhead", "50ohm-aprs-map", "50ohm-hamnet-map")


def wave_of(cid, r):
    """The task wave of a catalogue entry: 1 adopt (§2), 2a/2b the core, 3 the rest; None when it gets no task."""
    if cid in NOT_ADOPTED:
        return None
    if r["_sec"].startswith("2"):
        return "1"
    if cid in CORE_GROUP:
        return "2a" if cid in PILOTS else "2b"
    return "3"


def main(force=False):
    rows, clusters = load()
    by_id = {ranker.plain(r["ID"]): r for r in rows}
    sids = {cid: sim_id(cid) for cid in by_id}
    dup = {s for s in sids.values() if list(sids.values()).count(s) > 1}
    assert not dup, dup
    for k, v in list(BUILDS_ON.items()) + list(PRESET_OF.items()):
        assert k in by_id and v in by_id, (k, v)

    tasks = []
    for cid, r in by_id.items():
        wave = wave_of(cid, r)
        if not wave:
            continue
        sec = r["_sec"]
        if wave == "1":
            group = {"2.1": "single-page-labs", "2.2": "URM book pages", "2.3": "ossimulator",
                     "2.4": "larger apps", "2.5": "50ohm applets"}[sec]
        elif wave in ("2a", "2b"):
            group = CORE_GROUP[cid]
        else:
            group = r["_title"]
        tasks.append((cid, r, wave, group))

    OUT.mkdir(parents=True, exist_ok=True)
    written = 0
    for cid, r, wave, group in tasks:
        path = OUT / f"w{wave[0]}" / f"{sids[cid]}.md"
        path.parent.mkdir(exist_ok=True)
        text = render(cid, r, wave, group, by_id, sids, clusters)
        if path.exists() and FILLED_MARK in path.read_text() and not force:
            text = keep_filled(path.read_text(), text)
        path.write_text(text)
        written += 1
    write_index(tasks, by_id, sids)
    print(f"{written} task files written, {len(tasks)} tasks in the index")


def section(text, name):
    m = re.search(rf"^## {re.escape(name)}\n.*?(?=^## |\Z)", text, re.M | re.S)
    return m.group(0) if m else None


def keep_filled(old, new):
    """Regenerate a task whose spec was filled in, keeping its Sources and Model sections."""
    for name in ("Sources", "Model and presets"):
        kept, fresh = section(old, name), section(new, name)
        if kept and fresh:
            new = new.replace(fresh, kept)
    return new


FIN_NOTES = ["## Finance notes (all `fin-` tasks)", "",
    "- **Who it is for:** IT managers who meet these terms in budgets and with finance; they know IT, not accounting. "
    "Each page shows one purchase or decision seen two ways (cash vs expense, nominal vs discounted, price vs "
    "lifetime cost); make that contrast the stage.",
    "- **Generic principles only.** No product, vendor or software names; no country's tax law or VAT. Name the "
    "principle (straight-line depreciation over the useful life, NPV as the sum of discounted cash flows). Naming an "
    "accounting standard (IAS 16, IFRS 16) is fine in the explanation, not in the stage.",
    "- **Numbers are illustrative.** Prices, rates and costs are made-up but plausible, in euros, and the page says "
    "so once; formulas and rules must be standard and are checked in SPEC.md with a small script.",
    "- **Croatian practice:** the notes in catalogue §4.12 (\"Where Croatian practice commonly differs\") are not "
    "verified yet. Do not put them on the page; copy the one that applies into `NOTES.md` under \"For the owner\".",
    "- **Croatian terms:** standard Croatian accounting terms (amortizacija, kapitalni izdaci, operativni troškovi, "
    "novčani tok, neto sadašnja vrijednost, točka pokrića, vremenska razgraničenja); list your choices in "
    "`NOTES.md` so the owner can check them in one place.",
    "- **Balance sheet:** only where the entry asks for it (`fin-capex-opex`, `fin-lease-vs-buy`), as one or two "
    "lines (asset, liability), not a full statement.",
    "- **Shared models (catalogue §5.23):** keep the ledger (cash, expense, book value by month) or the discounting "
    "in its own module file inside your sim folder, pure and tested, so the coordinator can promote it to "
    "`models/` later. When the entry builds on another `fin-` sim, copy its module (COMMON.md §6).",
    "- **Learn tree:** the `npm run check` warning \"in no leaf yet\" is expected; suggest a leaf in your report "
    "(catalogue §4.12 has the proposed `money` area).", ""]


CMP_NOTES = ["## Compliance notes (all `cmp-` tasks)", "",
    "- **Who it is for:** IT managers, and IT staff stepping into management, in Croatia; they know the systems, not "
    "the law or the audit. Each page puts a procedure or a control in motion and shows one contrast (with and without "
    "the control, written vs operating, the average vs the tail, the clock started at awareness vs at the attack); "
    "make that contrast the stage, not the rule text.",
    "- **Not legal advice.** Name a law or standard only where the concept comes from it (GDPR / Opća uredba o zaštiti "
    "podataka, NIS2 and the Croatian Zakon o kibernetičkoj sigurnosti, ISO/IEC 27001, DORA) and cite the article or "
    "clause in the explanation, not on the stage. General principles only; no product, vendor or tool names; no step "
    "that reads as \"do this and you are compliant\". The page says once that it simplifies and is not legal advice.",
    "- **Primary sources:** the EU texts on EUR-Lex (GDPR is Regulation (EU) 2016/679, NIS2 Directive (EU) 2022/2555, "
    "DORA Regulation (EU) 2022/2554; use the official Croatian versions for the Croatian strings), the Croatian law in "
    "Narodne novine, the European Data Protection Board's guidelines (breach notification, impact assessment "
    "criteria), and ISO/IEC 27001 by clause number only (the text is paid; never quote it). Cite them in SPEC.md.",
    "- **Deadlines, thresholds and fines:** use the EU text's values where the entry needs them (GDPR's 72 hours and "
    "one month, NIS2's 24 hours / 72 hours / one month) with the article. The Croatian details in §4.13 "
    "(\"Where Croatian and EU practice matters\": bodies, the regulation, who categorises entities, AZOP, the workers' "
    "council, HNB and HANFA) were confirmed by the owner on 2026-11-08 and may go on the page, each with its law. A "
    "Croatian detail not listed there (a national threshold, a retention period, a fine amount) still gets *(check)*: "
    "keep it off the page and copy it into `NOTES.md` under \"For the owner\" with the source you would check.",
    "- **Numbers are illustrative.** Failure rates, team sizes, ticket counts and costs are made-up but plausible, and "
    "the page says so once; formulas (sampling probability, likelihood × impact, a fine ceiling as the higher of two "
    "values) are standard and checked in SPEC.md with a small script.",
    "- **One fictional organisation:** a small made-up firm with made-up people and systems; never a real company, a "
    "real authority's logo or a copy of an official form. Authorities appear by role (nadzorno tijelo / supervisory "
    "authority, nadležni CSIRT / competent CSIRT).",
    "- **Croatian terms:** the terms of the official Croatian texts (voditelj obrade, izvršitelj obrade, ispitanik, "
    "povreda osobnih podataka, procjena učinka na zaštitu podataka, nadzorno tijelo; ključni i važni subjekti, "
    "značajan incident). The owner settled these on 2026-11-07, use them as they are: obustava brisanja zbog spora "
    "(legal hold), odbor za promjene (change advisory board), račun za hitne slučajeve (break-glass account), dolazak, "
    "premještaj, odlazak (joiner, mover, leaver), načelo četiri oka, razdvajanje dužnosti, razine zrelosti. For any "
    "other term without a settled Croatian form, choose one, give the English in brackets once, and list your choices "
    "in `NOTES.md` so the owner can check them in one place.",
    "- **Shared models (catalogue §5.24):** keep people × roles × rights, the risk scoring, the incident clocks or the "
    "evidence trail in its own module file inside your sim folder, pure and tested, so the coordinator can promote it "
    "to `models/` later. When the entry builds on another sim, copy its module (COMMON.md §6).",
    "- **Learn tree:** the `npm run check` warning \"in no leaf yet\" is expected; suggest a leaf in your report "
    "(catalogue §4.13 has the proposed `compliance` area).", ""]


SET_NOTES = ["## Film set notes (all `set-` tasks)", "",
    "- **Who it is for:** people learning to work on a film set (trainees, new crew, day players, film students), "
    "taught by a colleague who trains film crews; they know neither the equipment nor the jobs. Each page puts one "
    "practice in motion and shows one contrast (with and without the practice, the right and the wrong order, under "
    "and over the limit); make that contrast the stage, not the rule. Not a quiz and not a slideshow.",
    "- **The set has the final word.** Every page says once, in the explanation and in a line the learner sees, that "
    "it simplifies, that its numbers are illustrative and that the production's safety briefing and the department "
    "head have the final word. A safety rule appears as the reason behind a practice (what goes wrong without it), "
    "never as a regulation to obey because the page says so; nothing on the page reads as \"do this and you are "
    "safe\".",
    "- **Specialist work from outside.** Connecting power (tie-ins and distribution), rigging, stunts, special effects "
    "and pyrotechnics, weapons, precision driving and operating lifts are shown as what the specialist controls and why "
    "everyone else stays out, never as steps someone could follow: no wiring, no rigging method, no charge or quantity, "
    "no weapon handling, no driving technique.",
    "- **Concepts, not tools** (COMMON.md §1): no brand or model of lamp, stand, radio, lift, camera, card or vehicle; "
    "say \"a 2 kW lamp\", \"a stand\", \"a lift\", \"a handheld radio\".",
    "- **Numbers are illustrative.** Wattages, wind speeds, weights, distances, hours, temperatures and decibels are "
    "made-up but plausible, and the page says so once; the physics (P = V × I, moments about the tipping edge, wind "
    "force with the square of the speed, E = m·g·h, stopping distance, decibels and a daily dose) is standard and is "
    "checked in SPEC.md with a small script.",
    "- **One fictional production:** a made-up feature film with a made-up crew and made-up locations; never a real "
    "production, company or person, and no real accident retold on the page (published accident reports may inform "
    "SPEC.md).",
    "- **Croatian terms and rules:** use the Croatian set term where one is in use and give the English in brackets "
    "once (crews often say the English word: gaffer, grip, call sheet). The terms and the Croatian rules marked "
    "*(check)* in catalogue §4.14 (the Croatian titles and \"Where Croatian practice matters\") are unverified: use a "
    "plain descriptive Croatian phrase on the page instead, and copy them into `NOTES.md` under \"For the owner\" with "
    "the source you would check. An EU directive may be named in the explanation, with its article, only where a "
    "number on the page comes from it (the noise action values, the minimum daily rest).",
    "- **Primary sources:** the EU texts on EUR-Lex (the framework directive 89/391/EEC, working time 2003/88/EC, noise "
    "2003/10/EC, manual handling 90/269/EEC, work equipment 2009/104/EC), the Croatian laws in Narodne novine, and the "
    "film and TV safety guidance published by safety regulators and industry safety committees. Cite them in SPEC.md; "
    "do not copy their text or figures onto the page.",
    "- **Shared models (catalogue §5.25):** keep the crew and chain, the floor plan, the forces and moments, the "
    "shooting day or the electrical load in its own module file inside your sim folder, pure and tested, so the "
    "coordinator can promote it to `models/` later. When the entry builds on another sim, copy its module "
    "(COMMON.md §6).",
    "- **Learn tree:** the `npm run check` warning \"in no leaf yet\" is expected; suggest a leaf in your report "
    "(catalogue §4.14 has the proposed `film-set` area).", ""]


def render(cid, r, wave, group, by_id, sids, clusters):
    sid = sids[cid]
    kind = "adopt" if wave == "1" else "build"
    title = esc(ranker.plain(r.get("Title") or r.get("Item") or r.get("Page") or r.get("Applet (`contents/html/…`)", "")))
    concept = esc(ranker.plain(r.get("Concept") or r.get("What it shows") or r.get("Shows") or ""))
    does = esc(ranker.plain(r.get("Student does") or r.get("Index entries (scenario ids)") or ""))
    seed = esc(ranker.plain(r.get("Seed / overlap") or r.get("Seed") or ""))
    cls = CLASS.get(ranker.plain(r.get("Class", "")), "")
    courses = ranker.plain(r.get("Courses", "")) or {"spl": "see catalogue", "urm": "URM", "ossim": "OS",
                                                     "50ohm": "HAM"}.get(cid.split("-")[0], ADOPT_COURSES.get(cid, ""))
    preset_host = PRESET_OF.get(cid)
    builds_on = BUILDS_ON.get(cid)
    lines = [f"# {sid}: {title}", ""]
    meta = [
        ("Task", f"`{sid}` (wave {wave}, {group})"),
        ("Catalogue entry", f"`{cid}` in `docs/catalogue.md` §{r['_sec']}"),
        ("Kind", f"**add a preset to `sims/{sids[preset_host]}/`** (no page of its own)" if preset_host
         else {"adopt": "adopt an existing simulator", "build": "build a new simulator"}[kind]),
        ("Folder", f"`sims/{sids[preset_host] if preset_host else sid}/`"),
        ("Class", cls or "decide on import (playbook §10.4)"),
        ("Size", ranker.plain(r.get("Size", "")) or "S"),
        ("Priority", ranker.plain(r.get("Pri", ""))),
        ("Courses", courses),
        ("Topic / tags / level", f"`{topic_of(cid, r['_title'])}` / " + ", ".join(f"`{t}`" for t in tags_of(cid))
         + f" / `{level_of(courses)}`"),
        ("Languages", "Croatian and English in one build since ossimulator `93da8f8` (task `ossimulator-english`), re-imported in t-0118"
         if cid.startswith("ossim-") else "Croatian and English (COMMON.md §4)"),
        ("Licence", "AGPL-3.0-or-later" + ("; source material CC BY 4.0, attribution required" if cid.startswith("50ohm") else "")),
    ]
    deps = ["wave 0 (foundation) merged"]
    if wave == "1" and cid.startswith("ossim-"):
        deps.append("none beyond wave 0")
    if preset_host:
        deps.append(f"**hard:** `{sids[preset_host]}` merged; only one preset task per host folder at a time")
    if builds_on:
        deps.append(f"soft: start after `{sids[builds_on]}` is merged and reuse its model (COMMON.md §6)")
    if cid in PILOTS:
        deps.append(f"pilot: its view becomes kit view **{PILOTS[cid]}** (wave 2a)")
    elif wave in ("2b", "3"):
        view = view_for(cid)
        if view:
            deps.append(f"uses kit view {view} once it exists; until then draw your own and say so in NOTES.md")
    meta.append(("Depends on", "; ".join(deps)))
    lines += ["| | |", "|---|---|"] + [f"| {k} | {v} |" for k, v in meta] + [""]

    lines += ["## Goal", ""]
    if kind == "build":
        lines += [f"One concept: **{concept}**.", "", f"The student: {does}.", ""]
    else:
        lines += [f"Bring the existing simulator into simdeck as `sims/{sid}/`: **{concept}**.", ""]
        if does:
            lines += [f"Notes from the catalogue: {does}.", ""]
    if preset_host:
        host = by_id[preset_host]
        lines += [f"This is a **preset on `{sids[preset_host]}`** ({ranker.plain(host.get('Title') or host.get('Item') or '')}), "
                  "not a page of its own (catalogue §5). Add it to that sim's presets, with its own strings in both "
                  "languages and its own tests. If the host's model cannot express it without changes, write the "
                  "change you need under \"Shared requests\" in the host's `NOTES.md` and stop.", ""]

    lines += ["## Read first", "",
              "1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).",
              "2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).",
              "3. `kit/template/` (the proto-simulator every new sim starts from).",
              f"4. This entry and its neighbours in `docs/catalogue.md` §{r['_sec']}."]
    n = 5
    if builds_on:
        lines.append(f"{n}. `sims/{sids[builds_on]}/` (the model this one builds on) and its `NOTES.md`.")
        n += 1
    if preset_host:
        lines.append(f"{n}. `sims/{sids[preset_host]}/` (the host page) and its `NOTES.md`.")
        n += 1
    lines.append("")

    srcs = []
    if kind == "adopt":
        srcs.append(f"`{adopt_source(cid, r)}` (the original)")
    srcs += sources_of(seed)
    if cid.startswith("cmp-"):
        srcs.append("The primary texts under \"Compliance notes\" below (EUR-Lex, Narodne novine, the EDPB's guidelines); "
                    "mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.")
    if cid.startswith("set-"):
        srcs.append("The primary texts under \"Film set notes\" below (EUR-Lex, Narodne novine, published film and TV "
                    "safety guidance); mark every number and rule you could not check with *(check)* and list it in "
                    "`NOTES.md`.")
    lines += ["## Sources", ""]
    lines += [f"- {s}" for s in srcs] if srcs else ["- No local course material. Use the vendor's documentation and "
                                                   "standard textbooks; mark every number and rule you could not check "
                                                   "with *(check)* and list it in `NOTES.md`."]
    if seed and kind == "build":
        lines.append(f"- Catalogue seed: {seed}")
    lines.append("")

    if cid.startswith("fin-"):
        lines += FIN_NOTES
    if cid.startswith("cmp-"):
        lines += CMP_NOTES
    if cid.startswith("set-"):
        lines += SET_NOTES
    if clusters.get(cid):
        lines += ["## Overlaps (catalogue §5)", ""]
        for num, name, rec in clusters[cid]:
            lines.append(f"- **§{num} {name}:** {esc(ranker.plain(rec))}")
        lines.append("")

    if kind == "adopt":
        lines += ["## Steps", "", adopt_steps(cid, r, sid, cls), ""]
        state = esc(ranker.plain(r.get("State", "")))
        lic = esc(ranker.plain(r.get("Licence / assets", "") or r.get("Licence", "")))
        if state or lic:
            lines += ["## Known state and issues", ""]
            if state:
                lines.append(f"- State: {state}")
            if lic:
                lines.append(f"- Licence and assets: {lic}")
            lines.append("")
    else:
        lines += ["## Model and presets", "",
                  "_To be filled before building: state, what one step does, rules in order, tie-breaks, params, "
                  "3–6 presets with expected outcomes, step count, legend, captions, terms in both languages, "
                  "misconceptions to target, out of scope._", "",
                  "## Steps", "",
                  (f"1. Skip: this is a preset on the host." if preset_host else f"1. `kit/new-sim.sh {sid} sims/{sid}` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator."),
                  "2. Write `sims/<id>/SPEC.md` from \"Model and presets\" above: every rule, tie-break and expected "
                  "number, with its source. Check the numbers with a small script before coding (playbook §2).",
                  "3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks "
                  "first, and break the code once to see each test fail.",
                  "4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.",
                  "5. `sim.json` with every required field; `status: \"wip\"` until done.",
                  "6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.", ""]

    lines += ["## Done when", "",
              "- Everything in COMMON.md §8 (definition of done) holds.",
              f"- Only files under `sims/{sids[preset_host] if preset_host else sid}/` changed"
              + (" (and only the preset's parts of them)" if preset_host else "") + ".",
              "- The report lists what you could not check, the shared requests, the tags you used, and the time "
              "from start to done.", ""]
    return "\n".join(lines)


def adopt_steps(cid, r, sid, cls):
    pre = cid.split("-")[0]
    lang = "Croatian" if "(hr" in (r.get("Item") or "") or pre in ("urm", "50ohm", "ossim") else "English"
    if "(hr/en)" in (r.get("Item") or ""):
        lang = "both (it has a toggle: keep the pattern, move it to the kit's)"
    if pre == "app":
        name = cid[len("app-"):]
        deeplinks = {
            "topologydrafter": "it already has `?sample=two-sites|dmz|campus&present=1&step=<n>`; keep them",
            "cephsim": "samples `hyperconverged`, `threeRacks`, `brokenRule`, `unbalanced` (add `?sample=`, about 20 lines in `js/main.js`)",
            "faultline": "samples `threeZone`, `onePdu`, `sizeTwo`, `usEast1`, `frontDoor` (add `?sample=`; `load(key)` exists)",
        }[name]
        extra = {
            "cephsim": "cephsim has never been opened in a real browser: open it (xvfb, as faultline's `scripts/shot.sh` does) before anything else.",
            "faultline": "faultline is a spike (phase 0b of 7); import what exists, and keep its `TODO.md` roadmap in `NOTES.md`.",
            "topologydrafter": "",
        }[name]
        return ADOPT_STEPS["app"].format(sid=sid, name=name, deeplinks=deeplinks, extra=extra)
    if pre == "ossim":
        page = "index" if cid == "ossim-map" else cid[len("ossim-"):]
        extra = ranker.plain(r.get("Index entries (scenario ids)", "")) or "none"
        return ADOPT_STEPS["ossim"].format(P=P, page=page, sid=sid, extra=extra)
    src = adopt_source(cid, r)
    file = os.path.basename(src)
    return ADOPT_STEPS[pre].format(src=src, sid=sid, file=file, cls=cls or "the right class", lang=lang, urm=URM, P=P)


VIEWS = [
    ("K1 message sequence chart", ("dhcp", "dns-res", "tls", "kerberos", "tcp", "smtp", "email-path", "oauth", "ntp",
                                   "ssh", "wpa", "8021x", "ipsec", "wireguard", "websocket", "http-exchange", "acme",
                                   "domain-join", "domain-logon", "ntlm", "smb", "syn-", "ftp")),
    ("K2 topology with moving packets", ("arp", "hop", "stp", "broadcast-storm", "traceroute", "routing", "route", "bgp",
                                         "anycast", "vrrp", "quorum", "raft", "vlan", "domains", "replication", "sites",
                                         "nat", "cgnat", "multicast", "roaming", "journey", "relay", "ad-sites")),
    ("K3 block grid", ("dedup", "backup", "backing", "snapshot", "thin", "cow", "raid", "mirror", "ssd", "send-receive",
                       "lvm", "retention", "ceph", "crush", "ec-vs", "vss", "checkpoints", "storage-spaces", "overlayfs")),
    ("K4 rule table", ("rule-first-match", "acl", "ntfs", "gpo", "fgpp", "pam", "dhcp-scope", "dns-records", "mac-table",
                       "routing-table", "firewall", "dmz", "access", "group-scopes", "zone-types")),
]


VIEW_OVERRIDE = {"net-osi-tcpip-map": None, "sec-digital-signature": None, "win-gpo-processing": None,
                 "win-gpo-software-install": None, "win-gpo-slow-link": None, "kk-backup-ncs": None,
                 "win-ad-backup-restore": "K2 topology with moving packets", "sto-ec-vs-replication": "K3 block grid",
                 "ham-multiple-access": "K3 block grid", "win-dhcp-policies": "K4 rule table",
                 "win-dhcp-superscope": None,
                 "win-ntfs-mft": "K3 block grid", "win-dhcp-scope-options": "K4 rule table", "win-dns-policies": "K4 rule table", "win-ipam-address-plan": "K3 block grid", "win-ipam-utilisation": None, "win-ipam-discovery": None, "net-tcp-congestion": None, "perf-utilisation-latency": None,
                 # compliance pages draw their own (a matrix, a timeline), not the rule table or the block grid
                 "cmp-privileged-access": None, "cmp-retention-hold": None,
                 # the calls are a handshake between departments: lanes per department, one arrow per call
                 "set-calls-sequence": "K1 message sequence chart"}


def view_for(cid):
    if cid in VIEW_OVERRIDE:
        return VIEW_OVERRIDE[cid]
    for name, keys in VIEWS:
        if any(k in cid for k in keys):
            return name
    return None


def write_index(tasks, by_id, sids):
    wave_name = {"1": "Wave 1: adopt what exists", "2a": "Wave 2a: pilots (each shapes a kit view)",
                 "2b": "Wave 2b: core technologies", "3": "Wave 3: derivatives"}
    lines = ["# simdeck tasks", "",
             "Generated from `docs/catalogue.md` by `tools/catalogue/tasks.py`. One task per simulator; each "
             "task file is self-contained together with `COMMON.md` and the repo. Wave 0 and the course and kit "
             "tasks are written by hand (`w0/`, `w4/`).", "",
             "Run order: wave 0 → wave 1 (in parallel) → wave 2a pilots → kit views K1–K4 → wave 2b (in parallel) "
             "→ wave 3 (in parallel, each after its soft dependency) → wave 4 course pages as sims become ready. "
             "Within a wave, tasks are independent except where **Depends on** says otherwise.", ""]
    lines += ["## Wave 0: foundation (coordinator, before anything else)", "",
              "| Task | What |", "|---|---|"]
    for f, what in W0_TASKS:
        lines.append(f"| [`{f}`](w0/{f}.md) | {what} |")
    lines.append("")
    order = {"1": 0, "2a": 1, "2b": 2, "3": 3}
    for wave in ("1", "2a", "2b", "3"):
        items = [t for t in tasks if t[2] == wave]
        if wave == "2b":
            items.sort(key=lambda t: CORE_ORDER[t[0]])
        elif wave == "3":
            items.sort(key=lambda t: (t[1]["_sec"], {"P1": 0, "P2": 1, "P3": 2}.get(ranker.plain(t[1].get("Pri", "")), 3), t[0]))
        lines += [f"## {wave_name[wave]} ({len(items)} tasks)", ""]
        if wave == "2a":
            lines += ["Then the kit tasks: " + ", ".join(f"[`{k}`](w0/{k}.md)" for k, _ in KIT_TASKS) + ".", ""]
        lines += ["| # | Task | Title | Group | Size | Pri | Depends on |", "|---|---|---|---|---|---|---|"]
        for i, (cid, r, w, group) in enumerate(items, 1):
            dep = []
            if cid in PRESET_OF:
                dep.append(f"preset on `{sids[PRESET_OF[cid]]}`")
            if cid in BUILDS_ON:
                dep.append(f"after `{sids[BUILDS_ON[cid]]}`")
            title = esc(ranker.plain(r.get("Title") or r.get("Item") or r.get("Page") or r.get("Applet (`contents/html/…`)", "")))
            lines.append(f"| {i} | [`{sids[cid]}`](w{wave[0]}/{sids[cid]}.md) | {title} | {group} | "
                         f"{ranker.plain(r.get('Size', '')) or 'S'} | {ranker.plain(r.get('Pri', ''))} | {'; '.join(dep)} |")
        lines.append("")
    lines += ["## Wave 4: course pages", "",
              "One task per course: [`w4/`](w4/). Each lists the sims the catalogue assigns to the course; the course "
              "file adds a sim when it is `ready`.", "",
              "## Not tasks", "",
              "- `dc-sim`: Python/Streamlit, cannot be copied into a static site. Its phenomena are build tasks "
              "(`utilisation-latency`, `tail-latency`, `retry-storm`, `goodhart-teams`, `littles-law`, `autoscaling-lag`).",
              "- `dr-lecture-estate`: documents, not a simulator; `instructor/map.html` is the answer key and must "
              "never be published. Its scenarios seed build tasks.",
              "- The 50ohm maps (`maidenhead`, `aprs_map`, `hamnet_map`): they need live map tiles or external "
              "services, which the build refuses. Revisit if the owner wants online-only pages.", "",
              "## Catalogue id → sim folder", "",
              "Area prefixes are dropped from folder names except `win-`, `lnx-`, `fin-`, `cmp-` and `set-`; a few names are overridden for "
              "clarity (`tasks.py` `SIM_ID_OVERRIDE`).", "",
              "| Catalogue id | Sim folder |", "|---|---|"]
    for cid, r, w, g in sorted(tasks, key=lambda t: t[0]):
        if sids[cid] != cid:
            lines.append(f"| `{cid}` | `{sids[cid]}` |")
    lines += ["", "## Tags used by the tasks", "",
              "Wave 0 task `vocabulary` added these to `tags.json`, with Croatian and English labels and search aliases",
              "(`tests/vocabulary.test.mjs` keeps this list, the task files and `tags.json` in step):", ""]
    used = sorted({t for cid, r, w, g in tasks for t in tags_of(cid)})
    lines.append(", ".join(f"`{t}`" for t in used))
    topics = sorted({topic_of(cid, r["_title"]) for cid, r, w, g in tasks})
    lines += ["", "Topics: " + ", ".join(f"`{t}`" for t in topics) + ".", ""]
    vocab = json.loads((REPO / "tags.json").read_text())
    unused = sorted(set(vocab["tags"]) - set(used))
    if unused:
        lines += ["Also in `tags.json`, used by no task yet: " + ", ".join(f"`{t}`" for t in unused) + ".", ""]
    (OUT / "README.md").write_text("\n".join(lines))


W0_TASKS = [
    ("kit-follow-ups", "done on main (cd893d4): kept for reference"),
    ("bilingual", "Croatian and English in every sim, the index and course pages"),
    ("contract-check", "one command that checks a sim against the contract, and the per-task gate"),
    ("vocabulary", "topics and tags every task needs, in both languages"),
    ("licence", "AGPL-3.0-or-later: LICENSE, package.json, source link on every page"),
    ("licence-source-repos", "AGPL-3.0-or-later in the repos simdeck copies from (owner: AGPL everything)"),
    ("shared-models", "where model code shared by several sims lives (`models/` done; first promotion waits on `dhcp-dora`)"),
    ("presets-in-index", "index and course entries that open a sim at a preset"),
    ("ossimulator-english", "English UI for ossimulator (in its own repo)"),
    ("freeze-originals", "notes in the original projects pointing to the simdeck copies"),
    ("publish", "build and deploy after every merge"),
]
KIT_TASKS = [
    ("kit-sequence-chart", "K1"), ("kit-topology", "K2"), ("kit-block-grid", "K3"), ("kit-rule-table", "K4"),
]

if __name__ == "__main__":
    main(force="--force" in sys.argv)
