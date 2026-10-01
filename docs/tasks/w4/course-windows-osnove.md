# course-windows-osnove: course page: Windows administration, basic (working name)

| | |
|---|---|
| Task | `course-windows-osnove` (wave 4) |
| Owner | coordinator or owner (admin → Kolegiji) |
| Size | S |
| Depends on | wave 0; add each sim when it is `ready` |
| Licence | AGPL-3.0-or-later |

## Goal

A course file `courses/windows-osnove.json` and its generated page: the playlist for **Windows administration, basic (working name)**, in the order the
course teaches it. Sims are added as they become `ready` (unfinished ones are flagged by the check, not
published).

## Do

- Create the course in the admin (Kolegiji → + Novi kolegij), or by hand per `docs/site-structure.md` §3.2.
- Use the working title above; the owner gives official course names later (not needed now). Ask for
  sections (lectures or weeks) and a short address only when the page is published.
- Order the sims below by the syllabus; leave out what the owner drops; tools never go on course pages.

## Candidate sims (37, from the catalogue's course column)

| Sim | Title | Wave | Catalogue § |
|---|---|---|---|
| `topologydrafter` | topologydrafter | 1 | 2.4 |
| `dhcp-dora` | DHCP DORA and the lease | 2a | 4.1 |
| `dns-records` | DNS record types | 2b | 4.2 |
| `dns-resolution` | Recursive and iterative resolution | 2b | 4.2 |
| `win-ad-structure` | Forest, tree, domain, OU | 2b | 4.5.1 |
| `win-dc-promotion` | What promoting a DC does | 2b | 4.5.1 |
| `win-domain-join` | Joining a domain | 2b | 4.5.1 |
| `win-domain-logon` | Domain logon | 2b | 4.5.1 |
| `win-group-scopes` | Group scopes and AGDLP | 2b | 4.5.1 |
| `win-gpo-precedence` | GPO precedence | 2b | 4.5.2 |
| `win-gpo-processing` | When policy applies | 2b | 4.5.2 |
| `win-dns-dynamic-update` | Secure dynamic updates | 2b | 4.5.3 |
| `win-dns-srv-records` | What AD puts in DNS | 2b | 4.5.3 |
| `win-dns-zone-types` | Zone types and replication scope | 2b | 4.5.3 |
| `win-dhcp-scope-options` | Scopes, reservations and option precedence | 2b | 4.5.4 |
| `win-ipam-address-plan` | Planning the address space | 2b | 4.5.5 |
| `win-wsus-flow` | How an update reaches a client | 2b | 4.5.6 |
| `win-access-token` | The access token | 2b | 4.5.7 |
| `win-ntfs-share-effective` | Effective access: NTFS plus share | 2b | 4.5.7 |
| `dhcp-relay` | DHCP relay and giaddr | 3 | 4.1 |
| `dhcp-rogue` | Rogue DHCP and snooping | 3 | 4.1 |
| `win-account-lockout` | Account lockout | 3 | 4.5.1 |
| `win-ou-vs-group` | OU or group? | 3 | 4.5.1 |
| `win-gpo-software-install` | Software installation | 3 | 4.5.2 |
| `win-dns-client-order` | How a Windows client resolves a name | 3 | 4.5.3 |
| `win-dns-forwarders` | Forwarders, conditional forwarders, root hints | 3 | 4.5.3 |
| `win-dhcp-authorization` | Authorizing a DHCP server | 3 | 4.5.4 |
| `win-wsus-client-cycle` | The client update cycle | 3 | 4.5.6 |
| `win-wsus-groups` | Computer groups and approvals | 3 | 4.5.6 |
| `win-boot` | Windows boot chain | 3 | 4.5.7 |
| `win-firewall-profiles` | Windows Firewall profiles | 3 | 4.5.7 |
| `win-ntfs-inheritance` | NTFS inheritance | 3 | 4.5.7 |
| `win-powershell-objects` | PowerShell pipes objects, bash pipes text | 3 | 4.5.7 |
| `win-registry` | The registry | 3 | 4.5.7 |
| `win-services` | Services and dependencies | 3 | 4.5.7 |
| `win-uac` | UAC and the split token | 3 | 4.5.7 |
| `win-vss` | Volume Shadow Copy | 3 | 4.5.7 |
