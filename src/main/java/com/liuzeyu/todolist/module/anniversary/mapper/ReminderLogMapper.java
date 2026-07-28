package com.liuzeyu.todolist.module.anniversary.mapper;

import com.liuzeyu.todolist.module.anniversary.entity.ReminderLog;
import org.apache.ibatis.annotations.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 提醒日志数据访问层（MyBatis Mapper）
 * <p>
 * 提供提醒日志的查询、插入和已读标记功能。
 * findByAnniversaryIdInAndRemindDatetimeBetween 用于批量查询指定时间范围内的提醒。
 */
@Mapper
public interface ReminderLogMapper {

    /**
     * 根据 ID 查询提醒日志
     *
     * @param id 日志 ID
     * @return 提醒日志
     */
    @Select("SELECT * FROM reminder_logs WHERE id = #{id}")
    ReminderLog findById(Long id);

    /**
     * 查询指定纪念日在指定时间的提醒记录（去重用）
     *
     * @param anniversaryId  纪念日 ID
     * @param remindDatetime 提醒时间
     * @return 匹配的提醒日志列表
     */
    @Select("SELECT * FROM reminder_logs WHERE anniversary_id = #{anniversaryId} AND remind_datetime = #{remindDatetime}")
    List<ReminderLog> findByAnniversaryIdAndRemindDatetime(@Param("anniversaryId") Long anniversaryId,
                                                            @Param("remindDatetime") LocalDateTime remindDatetime);

    /**
     * 查询所有未读提醒
     *
     * @return 未读提醒列表
     */
    @Select("SELECT * FROM reminder_logs WHERE is_read = 0")
    List<ReminderLog> findByIsReadFalse();

    /**
     * 批量查询指定纪念日在指定时间范围内的提醒
     *
     * @param anniversaryIds 纪念日 ID 列表
     * @param start          范围开始
     * @param end            范围结束
     * @return 提醒日志列表
     */
    @Select("<script>" +
            "SELECT * FROM reminder_logs WHERE anniversary_id IN " +
            "<foreach item='id' collection='anniversaryIds' open='(' separator=',' close=')'>#{id}</foreach>" +
            " AND remind_datetime BETWEEN #{start} AND #{end}" +
            "</script>")
    List<ReminderLog> findByAnniversaryIdInAndRemindDatetimeBetween(@Param("anniversaryIds") List<Long> anniversaryIds,
                                                                     @Param("start") LocalDateTime start,
                                                                     @Param("end") LocalDateTime end);

    /**
     * 插入提醒日志
     *
     * @param reminderLog 提醒日志实体
     * @return 影响行数
     */
    @Insert("INSERT INTO reminder_logs(anniversary_id, remind_datetime, is_read, created_at) " +
            "VALUES(#{anniversaryId}, #{remindDatetime}, #{isRead}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(ReminderLog reminderLog);

    /**
     * 标记提醒为已读
     *
     * @param id 日志 ID
     * @return 影响行数
     */
    @Update("UPDATE reminder_logs SET is_read=1 WHERE id=#{id}")
    int markAsRead(Long id);

    /**
     * 更新提醒日志
     *
     * @param reminderLog 提醒日志实体
     * @return 影响行数
     */
    @Update("UPDATE reminder_logs SET is_read=#{isRead} WHERE id=#{id}")
    int update(ReminderLog reminderLog);
}
