package com.universidad.redes.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.Nationalized;

@Entity
@Table(name = "OSI_LAYER", schema = "dbo")
public class OsiLayerJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, columnDefinition = "tinyint")
    private Byte id;

    @Column(name = "layer_number", nullable = false, unique = true, columnDefinition = "tinyint")
    private Byte layerNumber;

    @Nationalized
    @Column(name = "name", nullable = false, length = 50, unique = true)
    private String name;

    @Nationalized
    @Column(name = "description", nullable = false, length = 1000)
    private String description;

    @Nationalized
    @Column(name = "development_example", nullable = false, length = 1000)
    private String developmentExample;

    protected OsiLayerJpaEntity() {
    }

    public OsiLayerJpaEntity(
            Byte id,
            Byte layerNumber,
            String name,
            String description,
            String developmentExample
    ) {
        this.id = id;
        this.layerNumber = layerNumber;
        this.name = name;
        this.description = description;
        this.developmentExample = developmentExample;
    }

    public Byte getId() {
        return id;
    }

    public Byte getLayerNumber() {
        return layerNumber;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getDevelopmentExample() {
        return developmentExample;
    }
}
