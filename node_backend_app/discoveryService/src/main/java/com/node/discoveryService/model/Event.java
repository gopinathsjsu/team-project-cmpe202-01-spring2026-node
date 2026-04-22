package com.node.discoveryService.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;


@Entity
@Table(name = "events")
public class Event {
    
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private long eventId;

    private String eventName;
    private String eventDescription;
    private LocalDate eventStartDate;
    private LocalDate eventEndDate;
    private long eventOwnerId;
    private long maxCapacity;

    @Enumerated(EnumType.STRING)
    private EventStatus status;


    private LocalDate createdAt;
    private LocalDate updatedAt;
    private String imageUrl;

    private long waitlistCapacity;
    private String ticketPrice;
    private String eventTimeZone;
    private Instant eventStartInstant;
    private Instant eventEndInstant;
    private Instant eventPublishInstant;
    private LocalDate eventPublishDate;
    private long approverId;




    //Getters
    public String getEventName()
    {
        return eventName;
    }
    public String getEventDescription()
    {
        return eventDescription;
    }
    public LocalDate getEventStartDate()
    {
        return eventStartDate;
    }
    public LocalDate getEventEndDate()
    {
        return eventEndDate;
    }
    public long getEventOwnerId()
    {
        return eventOwnerId;
    }
     public long getMaxCapacity()
    {
        return maxCapacity;
    }
     public EventStatus getStatus()
    {
        return status;
    }
    public LocalDate getCreatedAt()
    {
        return createdAt;
    }
    public LocalDate getUpdatedAt()
    {
        return updatedAt;
    }
    public String getImageUrl()
    {
        return imageUrl;
    }
    public long getWaitlistCapacity()
    {
        return waitlistCapacity;
    }
     public String getTicketPrice()
    {
        return ticketPrice;
    }
     public String getEventTimeZone()
    {
        return eventTimeZone;
    }
     public Instant getEventStartInstant()
    {
        return eventStartInstant;
    }
     public Instant getEventEndInstant()
    {
        return eventEndInstant;
    }
     public Instant getEventPublishInstant()
    {
        return eventPublishInstant;
    }
     public LocalDate getEventPublishDate()
    {
        return eventPublishDate;
    }
     public long getApproverId()
    {
        return approverId;
    }


    //Setters
    public void setEventName(String eventName)
    {
        this.eventName = eventName;
    }
    public void setEventDescription(String eventDescription)
    {
        this.eventDescription = eventDescription;
    }
    public void setEventStartDate(LocalDate eventStartDate )
    {
        this.eventStartDate  = eventStartDate ;
    }
    public void setEventEndDate(LocalDate eventEndDate )
    {
        this.eventEndDate  = eventEndDate ;
    }
    public void setEventOwnerId(long eventOwnerId)
    {
        this.eventOwnerId = eventOwnerId;
    }
     public void setMaxCapacity(long maxCapacity)
    {
        this.maxCapacity = maxCapacity;
    }
     public void setStatus(EventStatus status)
    {
        this.status = status;
    }
    public void setCreatedAt(LocalDate createdAt)
    {
        this.createdAt = createdAt;
    }
    public void setUpdatedAt(LocalDate updatedAt)
    {
        this.updatedAt = updatedAt;
    }
    public void setImageUrl(String imageUrl)
    {
        this.imageUrl = imageUrl;
    }
    public void setWaitlistCapacity(long waitlistCapacity)
    {
        this.waitlistCapacity = waitlistCapacity;
    }
    public void setTicketPrice(String ticketPrice)
    {
        this.ticketPrice = ticketPrice;
    }
    public void setEventTimeZone(String eventTimeZone)
    {
        this.eventTimeZone = eventTimeZone;
    }
    public void setEventStartInstant(Instant eventStartInstant)
    {
        this.eventStartInstant = eventStartInstant;
    }
    public void setEventEndInstant(Instant eventEndInstant)
    {
        this.eventEndInstant = eventEndInstant;
    }
    public void setEventPublishInstant(Instant eventPublishInstant)
    {
        this.eventPublishInstant = eventPublishInstant;
    }
    public void setEventPublishDate(LocalDate eventPublishDate)
    {
        this.eventPublishDate = eventPublishDate;
    }
    public void setApproverId(long approverId)
    {
        this.approverId = approverId;
    }



    //Junction table for event and category
    @ManyToMany
    @JoinTable(
        name = "event_categories_mapping",
        joinColumns = @JoinColumn(name = "event_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    private List<EventCategory> categories; 


    public List<EventCategory> getCategories()
    {
        return categories;
    }

    public void setCategories(List<EventCategory> categories)
    {
        this.categories = categories;
    }



    //Junction table for location
    @ManyToOne
    @JoinColumn(name = "location_id")
    private EventLocation eventLocation;

    public EventLocation getEventLocation()
    {
        return eventLocation ;
    }

    public void setEventLocation(EventLocation eventLocation)
    {
        this.eventLocation  = eventLocation ;
    }
    

}
