#!/usr/bin/env bash

# Actualiza el agregado público del ledger y lo entrega a GitHub. El proceso se
# niega a tocar una copia de trabajo con cambios para no interferir con trabajo
# manual. El timer de usuario lo ejecuta cada hora mientras el equipo está activo.

set -euo pipefail

repo="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd -- "$repo"

if [[ -n "$(git status --porcelain=v1 --untracked-files=normal)" ]]; then
  echo "Actividad: copia de trabajo ocupada; se pospone la actualización."
  exit 0
fi

rama="$(git symbolic-ref --quiet --short HEAD || true)"
if [[ "$rama" != "master" ]]; then
  echo "Actividad: la rama activa no es master; se pospone la actualización."
  exit 0
fi

# Incorpora primero los commits automáticos del catálogo de GitHub. Si hay una
# carrera entre ambos procesos, el rebase conserva separados sus dos snapshots.
git pull --rebase --quiet origin master
node herramientas/sincronizar-actividad.js

if git diff --quiet -- datos-actividad.js; then
  echo "Actividad: el ledger no cambió."
  exit 0
fi

git add -- datos-actividad.js
git -c user.name="sitio-actividad[bot]" \
    -c user.email="sitio-actividad@users.noreply.github.com" \
    commit --quiet -m "Actualizar actividad agregada de IA"

if ! git push --quiet origin master; then
  git pull --rebase --quiet origin master
  git push --quiet origin master
fi

echo "Actividad: snapshot público actualizado y enviado."
