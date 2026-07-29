package com.liuzeyu.todolist.module.task.service;

import com.liuzeyu.todolist.module.task.dto.BatchOperationRequest;
import com.liuzeyu.todolist.module.task.entity.Task;
import com.liuzeyu.todolist.module.task.mapper.TaskMapper;
import com.liuzeyu.todolist.support.BaseUnitTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class BatchOperationServiceTest extends BaseUnitTest {

    @Mock
    private TaskMapper taskMapper;

    @InjectMocks
    private BatchOperationService batchOperationService;

    private Task makeTask(Long id, Long userId, int status) {
        Task t = new Task();
        t.setId(id);
        t.setUserId(userId);
        t.setStatus(status);
        t.setPriority(2);
        return t;
    }

    @Test
    @DisplayName("批量完成 - 只完成属于用户的任务")
    void complete_filtersByUser() {
        Task mine = makeTask(1L, 1L, 0);
        Task other = makeTask(2L, 2L, 0);
        when(taskMapper.findAllByIds(eq(1L), anyString())).thenReturn(List.of(mine, other));
        when(taskMapper.batchUpdate(anyList())).thenReturn(1);

        BatchOperationRequest req = new BatchOperationRequest();
        req.setTaskIds(List.of(1L, 2L));
        req.setOperation("complete");

        int count = batchOperationService.executeBatchOperation(1L, req);

        assertThat(count).isEqualTo(1);
        assertThat(mine.getStatus()).isEqualTo(1);
        assertThat(other.getStatus()).isEqualTo(0);
    }

    @Test
    @DisplayName("批量完成 - 已完成的任务不重复")
    void complete_skipsAlreadyCompleted() {
        Task completed = makeTask(1L, 1L, 1);
        when(taskMapper.findAllByIds(eq(1L), anyString())).thenReturn(List.of(completed));

        BatchOperationRequest req = new BatchOperationRequest();
        req.setTaskIds(List.of(1L));
        req.setOperation("complete");

        int count = batchOperationService.executeBatchOperation(1L, req);

        assertThat(count).isEqualTo(0);
        verify(taskMapper, never()).batchUpdate(anyList());
    }

    @Test
    @DisplayName("批量删除 - 级联删除子任务")
    void delete_cascades() {
        Task parent = makeTask(1L, 1L, 0);
        Task child = makeTask(2L, 1L, 0);
        child.setParentId(1L);
        when(taskMapper.findAllByIds(eq(1L), anyString())).thenReturn(List.of(parent));
        when(taskMapper.findByUserIdAndParentId(1L, 1L)).thenReturn(List.of(child));
        when(taskMapper.findByUserIdAndParentId(1L, 2L)).thenReturn(List.of());

        BatchOperationRequest req = new BatchOperationRequest();
        req.setTaskIds(List.of(1L));
        req.setOperation("delete");

        int count = batchOperationService.executeBatchOperation(1L, req);

        assertThat(count).isEqualTo(1);
        verify(taskMapper).batchDeleteByIds(List.of(1L, 2L));
    }

    @Test
    @DisplayName("批量移动 - 设置 listId")
    void move_setsListId() {
        Task t = makeTask(1L, 1L, 0);
        when(taskMapper.findAllByIds(eq(1L), anyString())).thenReturn(List.of(t));
        when(taskMapper.batchUpdate(anyList())).thenReturn(1);

        BatchOperationRequest req = new BatchOperationRequest();
        req.setTaskIds(List.of(1L));
        req.setOperation("move");
        req.setTargetListId(99L);

        int count = batchOperationService.executeBatchOperation(1L, req);

        assertThat(count).isEqualTo(1);
        assertThat(t.getListId()).isEqualTo(99L);
    }

    @Test
    @DisplayName("批量移动 - 目标 listId 为空抛异常")
    void move_noTarget_throws() {
        BatchOperationRequest req = new BatchOperationRequest();
        req.setTaskIds(List.of(1L));
        req.setOperation("move");

        assertThatThrownBy(() -> batchOperationService.executeBatchOperation(1L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("目标清单ID不能为空");
    }

    @Test
    @DisplayName("批量设置优先级 - 校验 1-3 范围")
    void setPriority_validatesRange() {
        BatchOperationRequest req = new BatchOperationRequest();
        req.setTaskIds(List.of(1L));
        req.setOperation("setPriority");
        req.setPriority(5);

        assertThatThrownBy(() -> batchOperationService.executeBatchOperation(1L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("无效的优先级");
    }

    @Test
    @DisplayName("批量设置优先级 - 正常")
    void setPriority_succeeds() {
        Task t = makeTask(1L, 1L, 0);
        when(taskMapper.findAllByIds(eq(1L), anyString())).thenReturn(List.of(t));
        when(taskMapper.batchUpdate(anyList())).thenReturn(1);

        BatchOperationRequest req = new BatchOperationRequest();
        req.setTaskIds(List.of(1L));
        req.setOperation("setPriority");
        req.setPriority(3);

        int count = batchOperationService.executeBatchOperation(1L, req);

        assertThat(count).isEqualTo(1);
        assertThat(t.getPriority()).isEqualTo(3);
    }

    @Test
    @DisplayName("未知操作类型抛异常")
    void unknownOperation_throws() {
        BatchOperationRequest req = new BatchOperationRequest();
        req.setTaskIds(List.of(1L));
        req.setOperation("unknownOp");

        assertThatThrownBy(() -> batchOperationService.executeBatchOperation(1L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("不支持的操作类型");
    }

    @Test
    @DisplayName("空 taskIds 列表抛异常")
    void emptyTaskIds_throws() {
        BatchOperationRequest req = new BatchOperationRequest();
        req.setTaskIds(List.of());
        req.setOperation("complete");

        assertThatThrownBy(() -> batchOperationService.executeBatchOperation(1L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("任务ID列表不能为空");
    }
}
