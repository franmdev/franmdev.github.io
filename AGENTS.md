# Reglas Estrictas de Ingenieria y Economia de Tokens (AGENTS.md v1.2)

## Reglas de Ahorro Extremo de Tokens de Salida (Output Tokens)
- CERO ARCHIVOS SIN CAMBIOS: Jamas incluyas en 'modifications' un archivo que no tenga modificaciones reales.
- MODO PATCH PREFERENTE: Si el lote indica modo 'patch' (o si modificas menos del 50% de un archivo existente), usa 'operation="patch"' y entrega UNICAMENTE la lista de 'patches' (search_block y replace_block exactos) dejando 'updated_content=""'.
- MODO REWRITE COMPACTO: Solo usa 'operation="rewrite"' cuando el lote lo pida expresamente para reconstruir una pagina completa. En modo 'rewrite', usa sangria de 2 espacios y NO escribas comentarios HTML decorativos largos (como <!-- ====== -->).
- TEXTOS TELEGRAFICOS (<=25 PALABRAS): En 'executive_summary', 'security_findings', 'quality_improvements' y 'reasoning' escribe en estilo telegrafico de ingenieria (maximo 15 a 25 palabras por punto).
