import test from "node:test";
import assert from "node:assert/strict";
import { localizeLiveText } from "../src/lib/localized-text";

test("financial values and counts follow React updates instead of restoring cached numbers", () => {
  for (const locale of ["pt-BR", "en-US", "zh-CN"] as const) {
    const previous = localizeLiveText(locale, "R$ 0,00");
    const updated = localizeLiveText(locale, "R$ 101.000,50", previous);
    assert.equal(updated.rendered, "R$ 101.000,50");
    assert.equal(localizeLiveText(locale, updated.rendered, updated).rendered, updated.rendered);
    assert.equal(localizeLiveText(locale, "2", localizeLiveText(locale, "1")).rendered, "2");
  }
});

test("translated labels retain their source on repeated passes and language changes", () => {
  const english = localizeLiveText("en-US", "  Custos  ");
  assert.equal(english.rendered, "  Costs  ");
  const repeated = localizeLiveText("en-US", english.rendered, english);
  assert.equal(repeated.source, "  Custos  ");
  const chinese = localizeLiveText("zh-CN", repeated.rendered, repeated);
  assert.equal(localizeLiveText("pt-BR", chinese.rendered, chinese).rendered, "  Custos  ");
  assert.equal(localizeLiveText("en-US", "Aprovado", repeated).rendered, "Approved");
});
