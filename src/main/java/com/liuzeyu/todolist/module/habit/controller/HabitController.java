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
 * 习惯控制器
 */
@RestController
@RequestMapping("/api/habits")
@RequiredArgsConstructor
@Tag(name = "习惯管理", description = "习惯的增删改查和打卡接口")
public class HabitController {

    private final HabitService habitService;

    @PostMapping
    @Operation(summary = "创建习惯")
    public Result<Habit> createHabit(@AuthenticationPrincipal Long userId,
                                     @RequestBody Habit habit) {
        return Result.success("创建成功", habitService.createHabit(userId, habit));
    }

    @GetMapping
    @Operation(summary = "获取习惯列表")
    public Result<List<Habit>> getHabits(@AuthenticationPrincipal Long userId) {
        return Result.success(habitService.getHabits(userId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取习惯详情")
    public Result<Habit> getHabit(@AuthenticationPrincipal Long userId,
                                  @PathVariable Long id) {
        return Result.success(habitService.getHabit(userId, id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新习惯")
    public Result<Habit> updateHabit(@AuthenticationPrincipal Long userId,
                                     @PathVariable Long id,
                                     @RequestBody Habit habit) {
        return Result.success("更新成功", habitService.updateHabit(userId, id, habit));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除习惯")
    public Result<Void> deleteHabit(@AuthenticationPrincipal Long userId,
                                    @PathVariable Long id) {
        habitService.deleteHabit(userId, id);
        return Result.success();
    }

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

    @DeleteMapping("/{id}/checkin")
    @Operation(summary = "取消打卡")
    public Result<Void> cancelCheckIn(@AuthenticationPrincipal Long userId,
                                      @PathVariable Long id,
                                      @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate checkDate) {
        habitService.cancelCheckIn(userId, id, checkDate);
        return Result.success();
    }

    @GetMapping("/{id}/records")
    @Operation(summary = "获取打卡记录")
    public Result<List<HabitRecord>> getRecords(@AuthenticationPrincipal Long userId,
                                                @PathVariable Long id) {
        return Result.success(habitService.getRecords(userId, id));
    }

    @GetMapping("/{id}/records/range")
    @Operation(summary = "获取日期范围内的打卡记录")
    public Result<List<HabitRecord>> getRecordsByRange(@AuthenticationPrincipal Long userId,
                                                       @PathVariable Long id,
                                                       @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
                                                       @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate) {
        return Result.success(habitService.getRecordsByDateRange(userId, id, startDate, endDate));
    }

    @GetMapping("/records/today")
    @Operation(summary = "获取今日所有习惯的打卡记录")
    public Result<List<HabitRecord>> getTodayRecords(@AuthenticationPrincipal Long userId) {
        return Result.success(habitService.getTodayRecords(userId));
    }
}
