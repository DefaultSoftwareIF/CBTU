package br.com.empresa.rodatrack.sync;

import java.util.List;

/**
 * "Aceitas": gravadas nesta chamada.
 * "Ignoradas": o servidor já tinha versão igual ou mais nova (reenvio idempotente).
 * O cliente marca as duas listas como sincronizadas.
 */
public record PushResponse(
        List<String> rodasAceitas,
        List<String> rodasIgnoradas,
        List<String> usinagensAceitas,
        List<String> usinagensIgnoradas) {
}
