package com.node.discoveryService.model;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;

@Entity
public class Event {
    
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private long id;

    private String title;
    private String description;
    private LocalDateTime dateTime;
    private String location;
    private long organizer_id;
    private long capacity;
    private String status;
    private LocalDateTime created_at;
    private LocalDateTime updated_at;
    private LocalDateTime approved_at;
    private long approved_by;
    private String image_url;


    //Getters
    public String getTitle()
    {
        return title;
    }
    public String getDescription()
    {
        return description;
    }
    public LocalDateTime getDateTime()
    {
        return dateTime;
    }
    public String getLocation()
    {
        return location;
    }
    public long getOrganizer_id()
    {
        return organizer_id;
    }
     public long getCapacity()
    {
        return capacity;
    }
     public String getStatus()
    {
        return status;
    }
    public LocalDateTime getCreated_at()
    {
        return created_at;
    }
    public LocalDateTime getUpdated_at()
    {
        return updated_at;
    }
    public LocalDateTime getApproved_at()
    {
        return approved_at;
    }
    public long getApproved_by()
    {
        return approved_by;
    }
    public String getImage_url()
    {
        return image_url;
    }


    //Setters
    public void setTitle(String title)
    {
        this.title = title;
    }
    public void setDescription(String description)
    {
        this.description = description;
    }
    public void setDateTime(LocalDateTime dateTime)
    {
        this.dateTime = dateTime;
    }
    public void setLocation(String location)
    {
        this.location = location;
    }
    public void setOrganizer_id(long organizer_id)
    {
        this.organizer_id = organizer_id;
    }
     public void setCapacity(long capacity)
    {
        this.capacity = capacity;
    }
     public void setStatus(String status)
    {
        this.status = status;
    }
    public void setCreated_at(LocalDateTime created_at)
    {
        this.created_at = created_at;
    }
    public void setUpdated_at(LocalDateTime updated_at)
    {
        this.updated_at = updated_at;
    }
    public void setApproved_at(LocalDateTime approved_at)
    {
        this.approved_at = approved_at;
    }
    public void setApproved_by(long approved_by)
    {
        this.approved_by = approved_by;
    }
    public void setImage_url(String image_url)
    {
        this.image_url = image_url;
    }


    //Junction table for event and category
    @ManyToMany
    @JoinTable(
        name = "event_category_junction",
        joinColumns = @JoinColumn(name = "event_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    private List<Category> categories; 


    public List<Category> getCategories()
    {
        return categories;
    }

    public void setCategories(List<Category> categories)
    {
        this.categories = categories;
    }

}
