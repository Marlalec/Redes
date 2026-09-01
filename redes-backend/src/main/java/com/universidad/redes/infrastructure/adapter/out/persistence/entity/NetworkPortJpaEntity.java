package com.universidad.redes.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.Nationalized;

@Entity
@Table(name = "NETWORK_PORT", schema = "dbo")
public class NetworkPortJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @Column(name = "port_number", nullable = false, unique = true)
    private Integer portNumber;

    @Nationalized
    @Column(name = "service", nullable = false, length = 80)
    private String service;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "protocol_id", nullable = false)
    private ProtocolJpaEntity protocol;

    @Nationalized
    @Column(name = "description", nullable = false, length = 1000)
    private String description;

    @Nationalized
    @Column(name = "development_example", nullable = false, length = 1000)
    private String developmentExample;

    protected NetworkPortJpaEntity() {
    }

    public NetworkPortJpaEntity(
            Integer id,
            Integer portNumber,
            String service,
            ProtocolJpaEntity protocol,
            String description,
            String developmentExample
    ) {
        this.id = id;
        this.portNumber = portNumber;
        this.service = service;
        this.protocol = protocol;
        this.description = description;
        this.developmentExample = developmentExample;
    }

    public Integer getId() {
        return id;
    }

    public Integer getPortNumber() {
        return portNumber;
    }

    public String getService() {
        return service;
    }

    public ProtocolJpaEntity getProtocol() {
        return protocol;
    }

    public String getDescription() {
        return description;
    }

    public String getDevelopmentExample() {
        return developmentExample;
    }
}
