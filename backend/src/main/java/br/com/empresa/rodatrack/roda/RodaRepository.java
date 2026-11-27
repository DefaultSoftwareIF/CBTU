package br.com.empresa.rodatrack.roda;

import java.time.Instant;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface RodaRepository extends MongoRepository<Roda, String> {
    List<Roda> findByRecebidoEmGreaterThanEqual(Instant desde);
}
