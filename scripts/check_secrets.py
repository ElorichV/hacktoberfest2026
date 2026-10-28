#!/usr/bin/env python3
"""
Validador pre-commit contra filtracion de API Keys en el repositorio publico.
Bloquea cualquier intento de commit que contenga llaves reales de Firecrawl, ElevenLabs, MojoAuth, etc.
"""
import re
import subprocess
import sys

SECRET_PATTERNS = [
    ("Firecrawl API Key", re.compile(r"\bfc-[a-zA-Z0-9]{16,}\b")),
    ("ElevenLabs / Secret Key", re.compile(r"\bsk_[a-zA-Z0-9]{20,}\b")),
    ("MojoAuth Argon2 Secret", re.compile(r"\$argon2id\$v=\d+")),
    (
        "Asignacion directa de API_KEY",
        re.compile(
            r'(FIRECRAWL_API_KEY|ELEVENLABS_API_KEY|MOJOAUTH_API_KEY|MOJOAUTH_CLIENT_SECRET)\s*=\s*["\'](?!colocar la apykey)[a-zA-Z0-9_\-\$]{12,}["\']'
        ),
    ),
]


def main() -> int:
    try:
        diff = subprocess.check_output(
            ["git", "diff", "--cached", "--unified=0", "--", ".", ":(exclude)scripts/check_secrets.py"],
            text=True,
            encoding="utf-8",
            errors="replace",
        )
    except Exception:
        return 0

    violations = []
    for line in diff.splitlines():
        if not line.startswith("+") or line.startswith("+++"):
            continue
        for label, pattern in SECRET_PATTERNS:
            if pattern.search(line):
                violations.append(label)

    if violations:
        print("[SEGURIDAD] Commit bloqueado: se detectaron credenciales reales en los archivos staged:")
        for v in sorted(set(violations)):
            print(f"   - {v}")
        print("Guarda las llaves unicamente en '.env' o 'backend/.env' (protegidos por .gitignore).")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
