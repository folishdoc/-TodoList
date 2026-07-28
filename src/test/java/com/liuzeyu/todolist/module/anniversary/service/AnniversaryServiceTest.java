package com.liuzeyu.todolist.module.anniversary.service;

import com.liuzeyu.todolist.common.exception.BusinessException;
import com.liuzeyu.todolist.module.anniversary.dto.AnniversaryRequest;
import com.liuzeyu.todolist.module.anniversary.entity.Anniversary;
import com.liuzeyu.todolist.module.anniversary.entity.ReminderLog;
import com.liuzeyu.todolist.module.anniversary.mapper.AnniversaryMapper;
import com.liuzeyu.todolist.module.anniversary.mapper.ReminderLogMapper;
import com.liuzeyu.todolist.module.task.entity.Task;
import com.liuzeyu.todolist.module.task.service.TaskService;
import com.liuzeyu.todolist.support.BaseUnitTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AnniversaryServiceTest extends BaseUnitTest {

    @Mock
    private AnniversaryMapper anniversaryMapper;

    @Mock
    private ReminderLogMapper reminderLogMapper;

    @Mock
    private TaskService taskService;

    @InjectMocks
    private AnniversaryService anniversaryService;

    @Test
    @DisplayName("创建纪念日 - 正常")
    void create_succeeds() {
        AnniversaryRequest req = new AnniversaryRequest();
        req.setName("结婚纪念日");
        req.setDate(LocalDate.of(2024, 5, 20));
        req.setRemindEnabled(true);
        req.setRemindDaysBefore("0,1");
        when(anniversaryMapper.insert(any(Anniversary.class))).thenReturn(1);

        Anniversary a = anniversaryService.create(1L, req);

        assertThat(a.getName()).isEqualTo("结婚纪念日");
        assertThat(a.getUserId()).isEqualTo(1L);
        assertThat(a.getRemindEnabled()).isTrue();
    }

    @Test
    @DisplayName("更新纪念日 - 越权抛异常")
    void update_wrongUser_throws() {
        Anniversary a = new Anniversary();
        a.setId(1L);
        a.setUserId(2L);
        when(anniversaryMapper.findById(1L)).thenReturn(a);

        AnniversaryRequest req = new AnniversaryRequest();
        req.setName("new");
        assertThatThrownBy(() -> anniversaryService.update(1L, 1L, req))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("更新纪念日 - 正常")
    void update_succeeds() {
        Anniversary a = new Anniversary();
        a.setId(1L);
        a.setUserId(1L);
        a.setName("old");
        when(anniversaryMapper.findById(1L)).thenReturn(a);
        when(anniversaryMapper.update(any(Anniversary.class))).thenReturn(1);

        AnniversaryRequest req = new AnniversaryRequest();
        req.setName("new");
        Anniversary result = anniversaryService.update(1L, 1L, req);

        assertThat(result.getName()).isEqualTo("new");
    }

    @Test
    @DisplayName("删除纪念日 - 正常")
    void delete_succeeds() {
        Anniversary a = new Anniversary();
        a.setId(1L);
        a.setUserId(1L);
        when(anniversaryMapper.findById(1L)).thenReturn(a);

        anniversaryService.delete(1L, 1L);

        verify(anniversaryMapper).deleteById(1L);
    }

    @Test
    @DisplayName("删除纪念日 - 越权抛异常")
    void delete_wrongUser_throws() {
        Anniversary a = new Anniversary();
        a.setId(1L);
        a.setUserId(2L);
        when(anniversaryMapper.findById(1L)).thenReturn(a);

        assertThatThrownBy(() -> anniversaryService.delete(1L, 1L))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("获取纪念日详情 - 转 VO 包含 nextDate 和 daysUntil")
    void getDetail_succeeds() {
        Anniversary a = new Anniversary();
        a.setId(1L);
        a.setUserId(1L);
        a.setName("生日");
        a.setDate(LocalDate.now().plusDays(10));
        a.setRepeatType("YEARLY");
        when(anniversaryMapper.findById(1L)).thenReturn(a);

        AnniversaryService.AnniversaryDetail vo = anniversaryService.getDetail(1L, 1L);

        assertThat(vo.getName()).isEqualTo("生日");
        assertThat(vo.getDaysUntil()).isBetween(0L, 365L);
    }

    @Test
    @DisplayName("列表查询 - 关键字搜索")
    void list_searchByKeyword() {
        Anniversary a1 = new Anniversary();
        a1.setId(1L);
        a1.setUserId(1L);
        a1.setName("生日");
        a1.setDate(LocalDate.now());
        when(anniversaryMapper.searchByName(1L, "生日")).thenReturn(List.of(a1));

        List<AnniversaryService.AnniversaryDetail> result = anniversaryService.list(1L, null, null, "生日", null);

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("列表查询 - 标签筛选")
    void list_filterByTag() {
        Anniversary a1 = new Anniversary();
        a1.setId(1L);
        a1.setUserId(1L);
        a1.setName("生日");
        a1.setDate(LocalDate.now());
        a1.setTags("家人,朋友");
        Anniversary a2 = new Anniversary();
        a2.setId(2L);
        a2.setUserId(1L);
        a2.setName("纪念日");
        a2.setDate(LocalDate.now());
        a2.setTags("其他");
        when(anniversaryMapper.findAllByUserId(1L)).thenReturn(List.of(a1, a2));

        List<AnniversaryService.AnniversaryDetail> result = anniversaryService.list(1L, null, null, null, "家人");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("生日");
    }

    @Test
    @DisplayName("列表查询 - 排序按 name 升序")
    void list_sortByName() {
        Anniversary a1 = new Anniversary();
        a1.setId(1L);
        a1.setUserId(1L);
        a1.setName("B");
        a1.setDate(LocalDate.now());
        Anniversary a2 = new Anniversary();
        a2.setId(2L);
        a2.setUserId(1L);
        a2.setName("A");
        a2.setDate(LocalDate.now());
        when(anniversaryMapper.findAllByUserId(1L)).thenReturn(List.of(a1, a2));

        List<AnniversaryService.AnniversaryDetail> result = anniversaryService.list(1L, "name", "asc", null, null);

        assertThat(result.get(0).getName()).isEqualTo("A");
        assertThat(result.get(1).getName()).isEqualTo("B");
    }

    @Test
    @DisplayName("生成关联待办 - 创建任务")
    void generateTodo_createsTask() {
        Anniversary a = new Anniversary();
        a.setId(1L);
        a.setUserId(1L);
        a.setName("生日");
        a.setDate(LocalDate.now().plusDays(7));
        a.setRepeatType("NONE");
        when(anniversaryMapper.findById(1L)).thenReturn(a);
        Task task = new Task();
        task.setId(99L);
        when(taskService.createTask(eq(1L), any())).thenReturn(task);

        Task result = anniversaryService.generateTodo(1L, 1L);

        assertThat(result.getId()).isEqualTo(99L);
        verify(taskService).createTask(eq(1L), any());
    }

    @Test
    @DisplayName("获取未读提醒 - 空列表当无纪念日时")
    void getPendingReminders_emptyWhenNoAnniversaries() {
        when(anniversaryMapper.findAllByUserId(1L)).thenReturn(List.of());

        List<ReminderLog> result = anniversaryService.getPendingReminders(1L);

        assertThat(result).isEmpty();
        verify(reminderLogMapper, never()).findByAnniversaryIdInAndRemindDatetimeBetween(any(), any(), any());
    }

    @Test
    @DisplayName("获取未读提醒 - 有纪念日时查询")
    void getPendingReminders_succeeds() {
        Anniversary a = new Anniversary();
        a.setId(1L);
        a.setUserId(1L);
        when(anniversaryMapper.findAllByUserId(1L)).thenReturn(List.of(a));
        ReminderLog log = new ReminderLog();
        log.setId(1L);
        when(reminderLogMapper.findByAnniversaryIdInAndRemindDatetimeBetween(any(), any(), any()))
                .thenReturn(List.of(log));

        List<ReminderLog> result = anniversaryService.getPendingReminders(1L);

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("标记提醒已读 - 存在则更新")
    void markReminderRead_succeeds() {
        ReminderLog log = new ReminderLog();
        log.setId(1L);
        log.setIsRead(false);
        when(reminderLogMapper.findById(1L)).thenReturn(log);

        anniversaryService.markReminderRead(1L);

        assertThat(log.getIsRead()).isTrue();
        verify(reminderLogMapper).update(log);
    }

    @Test
    @DisplayName("标记提醒已读 - 不存在则忽略")
    void markReminderRead_notFound_noop() {
        when(reminderLogMapper.findById(1L)).thenReturn(null);

        anniversaryService.markReminderRead(1L);

        verify(reminderLogMapper, never()).update(any());
    }
}
