#!/usr/bin/env bash
# Start a new native sim by copying the proto-simulator template.
#   kit/new-sim.sh <id> <dest-dir>      e.g. kit/new-sim.sh dedup sims/dedup
# Copies index.html, sim.js and sim.test.js, then rewrites the mechanical parts: the sim id, the paths to the kit and
# to the index, and the manifest placeholder's path. Content (title, model, controls) is yours to replace.
# Assumes the index is <repo>/index.html; change INDEX below if docs/site-structure.md says otherwise.
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
path_rel=$(realpath -m --relative-to="$repo" "$dest_abs/index.html")

cp "$kit_dir/template/index.html" "$kit_dir/template/sim.js" "$kit_dir/template/sim.test.js" "$dest_abs/"

sed -i \
  -e "s#href=\"\.\./kit\.css\"#href=\"$kit_rel/kit.css\"#" \
  -e "s#src=\"\.\./kit\.js\"#src=\"$kit_rel/kit.js\"#" \
  -e "s#href=\"\.\./\.\./index\.html\"#href=\"$index_rel\"#" \
  -e "s#data-sim=\"proto\"#data-sim=\"$id\"#g" \
  -e "s#\"id\": \"proto\"#\"id\": \"$id\"#" \
  -e "s#\"path\": \"kit/template/index\.html\"#\"path\": \"$path_rel\"#" \
  -e "s#\"tags\": \[\"template\"\]#\"tags\": []#" \
  -e "s#kit/new-sim.sh copies it#copied from kit/template#" \
  "$dest_abs/index.html"
sed -i -e "s#require('\.\./kit\.js')#require('$kit_rel/kit.js')#" "$dest_abs/sim.test.js"

echo "created $dest (id $id)"
echo "  kit:   $kit_rel/"
echo "  index: $index_rel"
echo "next: replace the model in sim.js, the page in index.html, the rule tests in sim.test.js;"
echo "      then run: node --test $dest/sim.test.js"
