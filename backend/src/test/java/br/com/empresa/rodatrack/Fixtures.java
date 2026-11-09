package br.com.empresa.rodatrack;

import br.com.empresa.rodatrack.roda.Medidas;
import br.com.empresa.rodatrack.roda.RodaDto;
import br.com.empresa.rodatrack.usinagem.UsinagemDto;
import java.math.BigDecimal;
import java.time.Instant;

/** Dados de exemplo (as medidas da roda RD-0417 do protótipo). */
public final class Fixtures {

    public static final Instant T0 = Instant.parse("2026-10-26T17:00:00.000Z");

    private Fixtures() {
    }

    public static Medidas medidas() {
        return new Medidas(new BigDecimal("840.0"), new BigDecimal("135.0"), new BigDecimal("28.0"),
                new BigDecimal("30.0"), new BigDecimal("1.2"));
    }

    public static Medidas medidasApos() {
        return new Medidas(new BigDecimal("838.2"), new BigDecimal("135.0"), new BigDecimal("26.8"),
                new BigDecimal("30.0"), new BigDecimal("1.2"));
    }

    public static RodaDto roda(Instant atualizadoEm) {
        return new RodaDto("RD-0417", "usuario-1", medidas(), T0, atualizadoEm);
    }

    public static UsinagemDto usinagem(String id, Instant atualizadoEm) {
        return new UsinagemDto(id, "RD-0417", "usuario-1", "AAR-1B NF", new BigDecimal("1.8"), medidas(),
                medidasApos(), "0.1.0-placeholder", T0, atualizadoEm);
    }
}
