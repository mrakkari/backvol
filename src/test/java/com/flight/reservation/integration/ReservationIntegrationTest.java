package com.flight.reservation.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.flight.reservation.dto.ReservationRequest;
import com.flight.reservation.dto.VolRequest;
import com.flight.reservation.entity.Passager;
import com.flight.reservation.entity.Vol;
import com.flight.reservation.repository.VolRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.IntStream;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class ReservationIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private VolRepository volRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;
    private Vol vol;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();

        // Création d'un vol pour les tests
        vol = new Vol(
                LocalDateTime.now().plusDays(1),
                LocalDateTime.now().plusDays(1).plusHours(2),
                "Paris",
                "Lyon",
                new BigDecimal("150.00"),
                120,
                10 // Capacité réduite pour tester facilement
        );
        vol = volRepository.save(vol);
    }

    @Test
    void should_create_vol_and_make_reservation() throws Exception {
        // Given - Create flight via API with LocalDate and LocalTime
        VolRequest volRequest = new VolRequest(
                LocalDate.now().plusDays(2),           // dateDepart
                LocalTime.of(10, 30),                  // heureDepart
                LocalDate.now().plusDays(2),           // dateArrivee
                LocalTime.of(13, 30),                  // heureArrivee
                "Marseille",
                "Toulouse",
                new BigDecimal("200.00"),
                90,
                180
        );

        String volJson = mockMvc.perform(post("/api/vols")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(volRequest))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Vol[] createdVols = objectMapper.readValue(volJson, Vol[].class);
        Vol createdVol = createdVols[0];

        // When - Make reservation
        Passager passager = new Passager("Test", "User", "test@email.com");
        ReservationRequest reservationRequest = new ReservationRequest(createdVol.getId(), passager, 2);

        mockMvc.perform(post("/api/reservations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reservationRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.numeroReservation").exists())
                .andExpect(jsonPath("$.nombrePlaces").value(2));
    }

    @Test
    void should_return_bad_request_when_over_reservation() throws Exception {
        // Given
        Passager passager = new Passager("Test", "User", "test@email.com");
        ReservationRequest reservationRequest = new ReservationRequest(vol.getId(), passager, 15); // More than capacity

        // When & Then
        mockMvc.perform(post("/api/reservations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reservationRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INSUFFICIENT_SEATS"));
    }

    @Test
    void should_filter_vols_by_criteria() throws Exception {
        // When & Then - Test with LocalDate parameters
        mockMvc.perform(get("/api/vols")
                        .param("villeDepart", "Paris")
                        .param("dateDepart", LocalDate.now().plusDays(1).toString())
                        .param("tri", "prix"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @RepeatedTest(3)
    @Transactional
    void should_handle_concurrent_reservations() throws Exception {
        // Given - Vol with limited capacity
        ExecutorService executor = Executors.newFixedThreadPool(5);

        try {
            // When - Multiple concurrent reservations
            List<CompletableFuture<Boolean>> futures = IntStream.range(0, 5)
                    .mapToObj(i -> CompletableFuture.supplyAsync(() -> {
                        try {
                            Passager passager = new Passager("User" + i, "Test", "user" + i + "@email.com");
                            ReservationRequest request = new ReservationRequest(vol.getId(), passager, 3);

                            return mockMvc.perform(post("/api/reservations")
                                            .contentType(MediaType.APPLICATION_JSON)
                                            .content(objectMapper.writeValueAsString(request)))
                                    .andReturn().getResponse().getStatus() == 201;

                        } catch (Exception e) {
                            return false;
                        }
                    }, executor))
                    .toList();

            // Then - Some should succeed, others should fail
            long successCount = futures.stream()
                    .mapToInt(future -> {
                        try {
                            return future.get() ? 1 : 0;
                        } catch (Exception e) {
                            return 0;
                        }
                    })
                    .sum();

            // Au maximum 3 réservations peuvent réussir (10 places / 3 = 3 réservations max)
            assert successCount <= 3;

        } finally {
            executor.shutdown();
        }
    }

    @Test
    void should_accept_date_only_format() throws Exception {
        // Test that the API accepts date-only format like "2025-09-22"
        VolRequest volRequest = new VolRequest(
                LocalDate.of(2025, 9, 22),             // dateDepart
                LocalTime.of(8, 0),                    // heureDepart
                LocalDate.of(2025, 9, 22),             // dateArrivee
                LocalTime.of(10, 30),                  // heureArrivee
                "Paris",
                "London",
                new BigDecimal("300.00"),
                150,
                200
        );

        mockMvc.perform(post("/api/vols")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(volRequest))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$[0].villeDepart").value("Paris"))
                .andExpect(jsonPath("$[0].villeArrivee").value("London"));
    }
}