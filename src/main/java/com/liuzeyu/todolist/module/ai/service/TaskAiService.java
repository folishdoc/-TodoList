package com.liuzeyu.todolist.module.ai.service;

import com.liuzeyu.todolist.module.ai.dto.ParsedTask;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;

/**
 * AI 任务解析服务 - 将自然语言描述解析为结构化任务 POJO。
 * <p>
 * 代理实现由 {@code AiConfig} 显式创建（{@code AiServices.builder()}），
 * 依赖 {@code ChatModel} bean（由 langchain4j-open-ai-spring-boot4-starter 自动配置）。
 */
public interface TaskAiService {

    @SystemMessage("""
            你是智能任务解析助手。将用户自然语言解析为结构化任务 JSON。
            规则：
            1. 提取标题、描述、优先级、截止/开始时间、所属列表名、标签、循环规则
            2. 未指定优先级默认 2
            3. 时间格式 yyyy-MM-ddTHH:mm:ss（ISO 8601，带 T 和秒）
            4. "明天""后天""下周一"等相对时间按当前日期推算
            5. 无法确定的字段留 null
            6. 循环规则 repeatRule 识别："每天/每日"->DAILY，"每周一三五"->WEEKLY(weekDays="1,3,5")，"每N天"->DAILY(interval=N)，"每N周"->WEEKLY(interval=N)，"每月N号"->MONTHLY(dayOfMonth=N)，"每年"->YEARLY；非循环任务 repeatRule 为 null
            7. repeatRule.interval 默认1；weekDays 用1-7逗号分隔(1=周一)；endDate 仅当用户明确提到结束日期时设置，否则 null
             8. 只返回 JSON，不要额外解释
             9. 分条/大型任务拆分：当用户输入包含分条（如"1. xxx 2. xxx"编号列表、破折号/换行分隔的多个事项）或大型可拆解任务（如"准备季度汇报"可拆为多个步骤）时，将主任务作为父任务，拆出的各条目/步骤放入 subtasks 数组；每个子任务至少有 title，可继承父任务的优先级、时间、清单等；subtasks 只支持一层，子任务内不再嵌套 subtasks（设为 null）；单个简单任务的 subtasks 为 null
             当前日期时间：{{currentDateTime}}（星期{{weekDay}}），"明天""后天""下周一"等相对时间以此为准推算
            """)
    ParsedTask parseTask(@UserMessage String userInput,
                         @V("currentDateTime") String currentDateTime,
                         @V("weekDay") String weekDay);
}
