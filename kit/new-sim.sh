#!/usr/bin/env bash
# Start a new native sim by copying the proto-simulator template.
#   kit/new-sim.sh <id> <dest-dir>      e.g. kit/new-sim.sh dedup sims/dedup
# Copies index.html, sim.js and sim.test.js, rewrites the mechanical parts (the sim id, the paths to the kit and to
# the index), and writes a status "wip" sim.json stub in the frame's manifest format (lib/manifest.mjs,
# docs/site-structure.md §2) so `npm run check` passes at once. Content (title, model, controls, sim.json) is yours
# to replace; the admin (npm run admin) does the same copy and then writes its own sim.json over the stub.
# The index is <repo>/index.html (docs/site-structure.md §7).
set -euo pipefail

if [ $# -ne 2 ]; then
  echo "usage: $0 <id> <dest-dir>" >&2
  exit 2
fi
id=$1
dest=$2
kit_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
repo=$(dirname "$kit_dir")
INDEX="$repo/index.html"

if ! [[ $id =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "id must be lowercase kebab-case: $id" >&2
  exit 2
fi
if [ -e "$dest" ]; then
  echo "refusing to overwrite: $dest exists" >&2
  exit 1
fi

mkdir -p "$dest"
dest_abs=$(cd "$dest" && pwd)
kit_rel=$(realpath -m --relative-to="$dest_abs" "$kit_dir")
index_rel=$(realpath -m --relative-to="$dest_abs" "$INDEX")

cp "$kit_dir/template/index.html" "$kit_dir/template/sim.js" "$kit_dir/template/sim.test.js" "$dest_abs/"

sed -i \
  -e "s#href=\"\.\./kit\.css\"#href=\"$kit_rel/kit.css\"#" \
  -e "s#src=\"\.\./kit\.js\"#src=\"$kit_rel/kit.js\"#" \
  -e "s#href=\"\.\./\.\./index\.html\"#href=\"$index_rel\"#" \
  -e "s#data-sim=\"proto\"#data-sim=\"$id\"#g" \
  -e "s#\"id\": \"proto\"#\"id\": \"$id\"#" \
  -e "s#kit/new-sim.sh copies it#copied from kit/template#" \
  "$dest_abs/index.html"
sed -i -e "s#require('\.\./kit\.js')#require('$kit_rel/kit.js')#" "$dest_abs/sim.test.js"

# sim.json stub: valid against the frame's checks, unpublished (wip). Topic and tag are placeholders taken from
# tags.json; class, steps and lang match the copied template page, so the placeholder check stays quiet.
if [ -f "$repo/tags.json" ]; then
  node -e '
    const fs = require("fs");
    const [id, file, vocab] = process.argv.slice(1);
    const v = JSON.parse(fs.readFileSync(vocab, "utf8"));
    const entry = {
      id, class: "stepper", status: "wip", title: id,
      concept: "Jedan pojam, jednom frazom (zamijeni)",
      summary: "Kopija predloška kit/template: zamijeni model, stranicu i ovaj opis.",
      topic: Object.keys(v.topics)[0], tags: [Object.keys(v.tags)[0]], level: "intro", lang: "hr", steps: 16,
    };
    fs.writeFileSync(file, JSON.stringify(entry, null, 2) + "\n");
  ' "$id" "$dest_abs/sim.json" "$repo/tags.json"
  stub="sim.json (status wip; set title, concept, summary, topic and tags)"
else
  stub="no sim.json: $repo/tags.json not found"
fi

echo "created $dest (id $id)"
echo "  kit:   $kit_rel/"
echo "  index: $index_rel"
echo "  $stub"
echo "next: replace the model in sim.js, the page in index.html, the rule tests in sim.test.js;"
echo "      then run: npm test && npm run check && npm run check:page -- $dest/index.html"
