package br.com.empresa.rodatrack.roda;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

/** Medidas da roda em mm (anguloEixo em graus). Mesmos campos de Medidas no front-end. */
public record Medidas(
        @NotNull @Positive @Digits(integer = 5, fraction = 3) @Field(targetType = FieldType.DECIMAL128) BigDecimal diametro,
        @NotNull @Positive @Digits(integer = 5, fraction = 3) @Field(targetType = FieldType.DECIMAL128) BigDecimal aro,
        @NotNull @Positive @Digits(integer = 5, fraction = 3) @Field(targetType = FieldType.DECIMAL128) BigDecimal frisoEspessura,
        @NotNull @Positive @Digits(integer = 5, fraction = 3) @Field(targetType = FieldType.DECIMAL128) BigDecimal frisoAltura,
        @NotNull @Digits(integer = 3, fraction = 3) @Field(targetType = FieldType.DECIMAL128) BigDecimal anguloEixo) {
}
