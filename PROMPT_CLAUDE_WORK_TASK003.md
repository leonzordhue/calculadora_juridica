# PROMPT — Claude-Work | TASK-003 | Petição Inicial HTML
> AKE/UFT-1.0 | PRINCIPAL → CLAUDE-WORK | Leia e execute na ordem.

---

## Contexto

v1.5.0 está em produção. O projeto foi modularizado.

**Regra permanente do seu território:**
- Você edita SOMENTE o HTML (estrutura, formulários, CSS)
- Nunca toque em `<script>`, nunca edite arquivos `.js`
- O Principal integra seu HTML com o JS do Codex

---

## TASK-003 — Campos HTML para Petição Inicial RMC/RCC

### Passo 1 — Preparar branch
```
git checkout main
git pull origin main
git checkout -b claude/work-pet-inicial
```

### Passo 2 — Localizar o ponto de inserção no HTML

Abra `LAADV_Calculadora_Juridica_v1.html`.
Busque o texto: `Dados da Petição`
Logo após o card-title desse card, insira o bloco A abaixo.

### Bloco A — Dropdown de tipo de peça + campo vara

Inserir logo após a linha que contém `Dados da Petição`:

```html
<div class="form-row cols-2">
  <div>
    <label>Tipo de Peça</label>
    <select id="pet-tipo-peca" onchange="toggleCamposPeca(this.value)">
      <option value="cumprimento">Cumprimento de Sentença — RMC/RCC</option>
      <option value="inicial">Petição Inicial — RMC/RCC</option>
    </select>
  </div>
  <div>
    <label>Número da Vara</label>
    <input type="text" id="pet-vara" placeholder="Ex: 3ª">
  </div>
</div>
```

### Bloco B — Campos exclusivos da Petição Inicial

Inserir logo após o Bloco A:

```html
<div id="campos-pet-inicial" class="hidden">
  <div class="form-row cols-1">
    <div>
      <label>Endereço Completo do Cliente</label>
      <input type="text" id="pet-endereco-cliente" placeholder="Rua, número, bairro, cidade, CEP">
    </div>
  </div>
  <div class="form-row cols-2">
    <div>
      <label>CNPJ do Banco Réu</label>
      <input type="text" id="pet-cnpj-banco" placeholder="00.000.000/0000-00">
    </div>
    <div>
      <label>Danos Morais Estimados (R$)</label>
      <input type="number" id="pet-danos-morais" step="0.01" min="0" placeholder="0,00">
    </div>
  </div>
</div>
```

### Passo 3 — Entregar

```
git add LAADV_Calculadora_Juridica_v1.html
git commit -m "feat(TASK-003): campos HTML para Petição Inicial RMC/RCC"
git push origin claude/work-pet-inicial
```

Depois atualize `AKE_TASKS.md`: TASK-003 `status: done` e marque os checkboxes HTML.
```
git add AKE_TASKS.md
git commit -m "docs: TASK-003 HTML concluído"
git push origin claude/work-pet-inicial
```

### Não faça mais nada
Não crie funções JS. Não edite os módulos. Não faça merge em main.
O Principal integra quando o Codex entregar o JS correspondente.

---

*AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MÓDULO: PROMPT_CLAUDE_WORK_TASK003*
