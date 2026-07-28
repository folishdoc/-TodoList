package com.liuzeyu.todolist.module.habit.controller;

import com.liuzeyu.todolist.common.result.Result;
import com.liuzeyu.todolist.module.habit.entity.Habit;
import com.liuzeyu.todolist.module.habit.entity.HabitRecord;
import com.liuzeyu.todolist.module.habit.service.HabitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * 习惯控制器 — 习惯 CRUD 及打卡接口
 * <p>
 * 路径前缀 /api/habits。提供习惯的增删改查、打卡、取消打卡、
 * 打卡记录查询（按日期范围）、今日打卡记录查询等功能。
 */
@RestController
@RequestMapping("/api/habits")
@RequiredArgsConstructor
@Tag(name = "习惯管理", description = "习惯的增删改查和打卡接口")
public class HabitController {

    private final HabitService habitService;

    /**
     * 创建习惯
     *
     * @param userId 用户 ID
     * @param habit  习惯实体
     * @return 创建后的习惯
     */
    @PostMapping
    @Operation(summary = "创建习惯")
    public Result<Habit> createHabit(@AuthenticationPrincipal Long userId,
                                     @RequestBody Habit habit) {
        return Result.success("创建成功", habitService.createHabit(userId, habit));
    }

    /**
     * 获取习惯列表
     *
     * @param userId 用户 ID
     * @return 习惯列表
     */
    @GetMapping
    @Operation(summary = "获取习惯列表")
    public Result<List<Habit>> getHabits(@AuthenticationPrincipal Long userId) {
        return Result.success(habitService.getHabits(userId));
    }

    /**
     * 获取习惯详情
     *
     * @param userId 用户 ID
     * @param id     习惯 ID
     * @return 习惯实体
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取习惯详情")
    public Result<Habit> getHabit(@AuthenticationPrincipal Long userId,
                                  @PathVariable Long id) {
        return Result.success(habitService.getHabit(userId, id));
    }

    /**
     * 更新习惯
     *
     * @param userId 用户 ID
     * @param id     习惯 ID
     * @param habit  更新数据
     * @return 更新后的习惯
     */
    @PutMapping("/{id}")
    @Operation(summary = "更新习惯")
    public Result<Habit> updateHabit(@AuthenticationPrincipal Long userId,
                                     @PathVariable Long id,
                                     @RequestBody Habit habit) {
        return Result.success("更新成功", habitService.updateHabit(userId, id, habit));
    }

    /**
     * 删除习惯
     *
     * @param userId 用户 ID
     * @param id     习惯 ID
     * @return 空响应
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除习惯")
    public Result<Void> deleteHabit(@AuthenticationPrincipal Long userId,
                                    @PathVariable Long id) {
        habitService.deleteHabit(userId, id);
        return Result.success();
    }

    /**
     * 打卡
     *
     * @param userId          用户 ID
     * @param id              习惯 ID
     * @param checkDate       打卡日期（默认今天）
     * @param completionValue 完成值
     * @param note            备注
     * @param isMakeup        是否补卡
     * @return 打卡记录
     */
    @PostMapping("/{id}/checkin")
    @Operation(summary = "打卡")
    public Result<HabitRecord> checkIn(@AuthenticationPrincipal Long userId,
                                       @PathVariable Long id,
                                       @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate checkDate,
                                       @RequestParam(required = false) Double completionValue,
                                       @RequestParam(required = false) String note,
                                       @RequestParam(required = false) Boolean isMakeup) {
        if (checkDate == null) {
            checkDate = LocalDate.now();
        }
        return Result.success("打卡成功", habitService.checkIn(userId, id, checkDate, completionValue, note, isMakeup));
    }

    /**
     * 取消打卡
     *
     * @param userId    用户 ID
     * @param id        习惯 ID
     * @param checkDate 打卡日期
     * @return 空响应
     */
    @DeleteMapping("/{id}/checkin")
    @Operation(summary = "取消打卡")
    public Result<Void> cancelCheckIn(@AuthenticationPrincipal Long userId,
                                      @PathVariable Long id,
                                      @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate checkDate) {
        habitService.cancelCheckIn(userId, id, checkDate);
        return Result.success();
    }

    /**
     * 获取打卡记录
     *
     * @param userId 用户 ID
     * @param id     习惯 ID
     * @return 打卡记录列表
     */
    @GetMapping("/{id}/records")
    @Operation(summary = "获取打卡记录")
    public Result<List<HabitRecord>> getRecords(@AuthenticationPrincipal Long userId,
                                                @PathVariable Long id) {
        return Result.success(habitService.getRecords(userId, id));
    }

    /**
     * 获取日期范围内的打卡记录
     *
     * @param userId    用户 ID
     * @param id        习惯 ID
     * @param startDate 开始日期
     * @param endDate   结束日期
     * @return 打卡记录列表
     */
    @GetMapping("/{id}/records/range")
    @Operation(summary = "获取日期范围内的打卡记录")
    public Result<List<HabitRecord>> getRecordsByRange(@AuthenticationPrincipal Long userId,
                                                       @PathVariable Long id,
                                                       @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
                                                       @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate) {
        return Result.success(habitService.getRecordsByDateRange(userId, id, startDate, endDate));
    }

    /**
     * 获取今日所有习惯的打卡记录
     *
     * @param userId 用户 ID
     * @return 今日打卡记录列表
     */
    @GetMapping("/records/today")
    @Operation(summary = "获取今日所有习惯的打卡记录")
    public Result<List<HabitRecord>> getTodayRecords(@AuthenticationPrincipal Long userId) {
        return Result.success(habitService.getTodayRecords(userId));
    }
}
