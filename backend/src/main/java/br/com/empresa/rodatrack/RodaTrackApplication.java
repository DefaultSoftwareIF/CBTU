package br.com.empresa.rodatrack;

import java.time.Clock;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class RodaTrackApplication {

    public static void main(String[] args) {
        SpringApplication.run(RodaTrackApplication.class, args);
    }

    /** Relógio injetável: permite fixar o horário nos testes. */
    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}
