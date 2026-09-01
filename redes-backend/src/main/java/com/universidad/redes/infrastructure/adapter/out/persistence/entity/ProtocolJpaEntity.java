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
@Table(name = "PROTOCOL", schema = "dbo")
public class ProtocolJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @Nationalized
    @Column(name = "name", nullable = false, length = 50, unique = true)
    private String name;

    @Nationalized
    @Column(name = "description", nullable = false, length = 1000)
    private String description;

    @Column(name = "transport_type", nullable = false, length = 10)
    private String transportType;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "osi_layer_id", nullable = false)
    private OsiLayerJpaEntity osiLayer;

    @Nationalized
    @Column(name = "development_example", nullable = false, length = 1000)
    private String developmentExample;

    protected ProtocolJpaEntity() {
    }

    public ProtocolJpaEntity(
            Integer id,
            String name,
            String description,
            String transportType,
            OsiLayerJpaEntity osiLayer,
            String developmentExample
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.transportType = transportType;
        this.osiLayer = osiLayer;
        this.developmentExample = developmentExample;
    }

    public Integer getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getTransportType() {
        return transportType;
    }

    public OsiLayerJpaEntity getOsiLayer() {
        return osiLayer;
    }

    public String getDevelopmentExample() {
        return developmentExample;
    }
}
