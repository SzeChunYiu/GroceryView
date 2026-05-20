#!/usr/bin/env bash
set -euo pipefail

unset PYTHONHOME
unset PYTHONPATH
export PYTHONNOUSERSITE=1

python -m pip install --upgrade 'setuptools>=68' 'packaging>=24.2' wheel
python -m pip install --no-build-isolation -e '.[dev]'
python scripts/smoke_dagster_definitions.py
