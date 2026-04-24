package com.node.discoveryService.model;

import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class EventCategory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String categoryId;
    
    private String categoryName;
    private String categoryDescription;
    private String categoryImage;
    private LocalDate createdAt;
    private LocalDate updatedAt;
    
    //Getters
    public String getCategoryName()
    {
        return categoryName;
    }
    public String getCategoryDescription()
    {
        return categoryDescription;
    }
    public String getCategoryImage()
    {
        return categoryImage;
    }
    public LocalDate getCreatedAt()
    {
        return createdAt;
    }
    public LocalDate getUpdatedAt()
    {
        return updatedAt;
    }

    //Setters
    public void setCategoryName(String categoryName)
    {
        this.categoryName = categoryName;
    }
    public void setCategoryDescription(String categoryDescription)
    {
        this.categoryDescription = categoryDescription;
    }
    public void setCategoryImage(String categoryImage)
    {
        this.categoryImage = categoryImage;
    }
    public void setCreatedAt(LocalDate CreatedAt)
    {
        this.createdAt = CreatedAt;
    }
    public void setUpdatedAt(LocalDate updatedAt)
    {
        this.updatedAt = updatedAt;
    }
   
}
