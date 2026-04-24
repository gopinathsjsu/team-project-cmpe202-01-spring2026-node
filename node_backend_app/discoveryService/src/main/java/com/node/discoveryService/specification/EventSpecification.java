package com.node.discoveryService.specification;

import org.springframework.data.jpa.domain.Specification;
import com.node.discoveryService.model.Event;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.criteria.Predicate;

public class EventSpecification {
    public static Specification<Event> withFilters(
        String keyword,
        String location,
        LocalDate date,
        String category
    )
    {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            if(keyword != null && !keyword.isEmpty())
            {
                predicates.add(criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("eventName")), "%" + keyword.toLowerCase() + "%"),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("eventDescription")), "%" + keyword.toLowerCase() + "%")
                ));
            }

            if(location != null && !location.isEmpty())
            {
                predicates.add(criteriaBuilder.or(criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.lower(root.join("eventLocation").get("locationName"))), "%" + location.toLowerCase() + "%"), criteriaBuilder.like(criteriaBuilder.lower(root.join("eventLocation").get("locationAddress")), "%" + location.toLowerCase() + "%")));
            }

            if(date != null)
            {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("eventStartDate"), date));
            }

            if(category != null && !category.isEmpty())
            {
                predicates.add(criteriaBuilder.equal(criteriaBuilder.lower(root.join("categories").get("categoryName")), category.toLowerCase()));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
            
        };
    }
}
