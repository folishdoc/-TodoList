package com.liuzeyu.todolist.module.anniversary.repository;

import com.liuzeyu.todolist.module.anniversary.entity.ReminderLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReminderLogRepository extends JpaRepository<ReminderLog, Long> {
    List<ReminderLog> findByAnniversaryIdAndRemindDatetime(Long anniversaryId, LocalDateTime remindDatetime);

    List<ReminderLog> findByIsReadFalse();

    List<ReminderLog> findByAnniversaryIdInAndRemindDatetimeBetween(List<Long> anniversaryIds, LocalDateTime start, LocalDateTime end);
}
