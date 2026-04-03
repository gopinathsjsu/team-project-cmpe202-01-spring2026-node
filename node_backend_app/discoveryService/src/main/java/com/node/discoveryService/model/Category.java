package com.node.discoveryService.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Category {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    
    private String name;
    
    //Getters
    public String getName()
    {
        return name;
    }

    //Setters
    public void setName(String name)
    {
        this.name = name;
    }
}
