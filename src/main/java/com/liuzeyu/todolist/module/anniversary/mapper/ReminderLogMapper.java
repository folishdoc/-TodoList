package com.liuzeyu.todolist.module.anniversary.mapper;

import com.liuzeyu.todolist.module.anniversary.entity.ReminderLog;
import org.apache.ibatis.annotations.*;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface ReminderLogMapper {

    @Select("SELECT * FROM reminder_logs WHERE id = #{id}")
    ReminderLog findById(Long id);

    @Select("SELECT * FROM reminder_logs WHERE anniversary_id = #{anniversaryId} AND remind_datetime = #{remindDatetime}")
    List<ReminderLog> findByAnniversaryIdAndRemindDatetime(@Param("anniversaryId") Long anniversaryId,
                                                            @Param("remindDatetime") LocalDateTime remindDatetime);

    @Select("SELECT * FROM reminder_logs WHERE is_read = 0")
    List<ReminderLog> findByIsReadFalse();

    @Select("<script>" +
            "SELECT * FROM reminder_logs WHERE anniversary_id IN " +
            "<foreach item='id' collection='anniversaryIds' open='(' separator=',' close=')'>#{id}</foreach>" +
            " AND remind_datetime BETWEEN #{start} AND #{end}" +
            "</script>")
    List<ReminderLog> findByAnniversaryIdInAndRemindDatetimeBetween(@Param("anniversaryIds") List<Long> anniversaryIds,
                                                                     @Param("start") LocalDateTime start,
                                                                     @Param("end") LocalDateTime end);

    @Insert("INSERT INTO reminder_logs(anniversary_id, remind_datetime, is_read, created_at) " +
            "VALUES(#{anniversaryId}, #{remindDatetime}, #{isRead}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(ReminderLog reminderLog);

    @Update("UPDATE reminder_logs SET is_read=1 WHERE id=#{id}")
    int markAsRead(Long id);

    @Update("UPDATE reminder_logs SET is_read=#{isRead} WHERE id=#{id}")
    int update(ReminderLog reminderLog);
}
