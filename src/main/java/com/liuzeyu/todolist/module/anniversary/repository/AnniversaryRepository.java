package com.liuzeyu.todolist.module.anniversary.repository;

import com.liuzeyu.todolist.module.anniversary.entity.Anniversary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnniversaryRepository extends JpaRepository<Anniversary, Long> {
    List<Anniversary> findAllByUserId(Long userId);

    @Query("SELECT a FROM Anniversary a WHERE a.userId = :userId AND a.name LIKE %:keyword%")
    List<Anniversary> searchByName(@Param("userId") Long userId, @Param("keyword") String keyword);

    @Query("SELECT a FROM Anniversary a WHERE a.userId = :userId AND a.remindEnabled = true")
    List<Anniversary> findRemindEnabledByUserId(@Param("userId") Long userId);
}
