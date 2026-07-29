<!--
/**
 * Dashboard.vue — 主应用界面（单页应用唯一路由）
 *
 * 整个应用的 shell，包含多层布局：
 * 1. 左侧图标导航栏：清单/日历/习惯/纪念日/提醒
 * 2. 左侧边栏（仅清单模块）：LOGO + 菜单（全部/今日/未来/清单列表/统计/标签）
 * 3. 主内容区：根据 currentModule 和 activeMenu 切换显示不同视图
 *    - tasks 模块：任务列表 / 数据统计 / 标签管理
 *    - calendar 模块：CalendarView 日历组件
 *    - habits 模块：HabitsView 习惯追踪
 *    - anniversaries 模块：AnniversaryList 纪念日
 * 4. 右侧编辑面板：选中任务后展开的内联编辑区（备忘录风格）
 * 5. 新建任务对话框 + 创建清单对话框
 *
 * 组合了大量 composable：useTaskCrud / useTaskEdit / useSubtasks / useTags /
 * useAttachments / useLists / useBatchOps / useReminders / useTaskSync
 * 每个 composable 管理独立的功能域，通过本组件协调数据流。
 */
-->
<template>
  <div class="dashboard-container">
    <el-container>
      <!-- 图标导航栏 -->
      <el-aside width="60px" class="icon-sidebar">
        <div class="icon-nav">
          <div
            class="nav-item"
            :class="{ active: currentModule === 'tasks' }"
            @click="currentModule = 'tasks'"
            title="清单"
          >
            <el-icon :size="24"><List /></el-icon>
          </div>
          <div
            class="nav-item"
            :class="{ active: currentModule === 'calendar' }"
            @click="currentModule = 'calendar'"
            title="日历"
          >
            <el-icon :size="24"><Calendar /></el-icon>
          </div>
          <div
            class="nav-item"
            :class="{ active: currentModule === 'habits' }"
            @click="currentModule = 'habits'"
            title="习惯"
          >
            <el-icon :size="24"><TrendCharts /></el-icon>
          </div>
          <div
            class="nav-item"
            :class="{ active: currentModule === 'anniversaries' }"
            @click="currentModule = 'anniversaries'"
            title="纪念日"
          >
            <el-icon :size="24"><Clock /></el-icon>
          </div>
          <el-popover placement="right" :width="300" trigger="click" @show="loadReminders">
            <template #reference>
              <div class="nav-item bell-btn">
                <el-badge :value="unreadReminderCount" :hidden="unreadReminderCount === 0">
                  <el-icon :size="24"><Bell /></el-icon>
                </el-badge>
              </div>
            </template>
            <div class="reminder-popover">
              <h4>纪念日提醒</h4>
              <el-empty v-if="reminders.length === 0" description="暂无提醒" :image-size="40" />
              <div v-else class="reminder-list">
                <div
                  v-for="r in reminders"
                  :key="r.id"
                  class="reminder-item"
                  @click="handleReminderClick(r)"
                >
                  <div class="reminder-name">{{ getReminderName(r.anniversaryId) }}</div>
                  <div class="reminder-time">{{ formatReminderTime(r.remindDatetime) }}</div>
                </div>
              </div>
            </div>
          </el-popover>
        </div>

        <!-- 底部：登出 -->
        <div class="icon-nav-bottom">
          <div class="nav-item" title="退出登录" @click="handleLogout">
            <el-icon :size="22"><SwitchIcon /></el-icon>
          </div>
        </div>
      </el-aside>

      <!-- 主容器 -->
      <el-container>
        <!-- 侧边栏（仅清单模块显示） -->
        <el-aside v-if="currentModule === 'tasks'" width="250px" class="sidebar">
          <div class="logo">
            <h2>📝 Todolist</h2>
          </div>

          <el-menu :default-active="activeMenu" @select="handleMenuSelect">
            <el-menu-item index="all">
              <el-icon><List /></el-icon>
              <span>全部任务</span>
            </el-menu-item>
            <el-menu-item index="today">
              <el-icon><Calendar /></el-icon>
              <span>今日任务</span>
            </el-menu-item>
            <el-menu-item index="upcoming">
              <el-icon><Clock /></el-icon>
              <span>未来任务</span>
            </el-menu-item>

            <el-divider />

            <div class="list-header">
              <span>我的清单</span>
              <el-button type="primary" size="small" circle @click="showCreateListDialog = true">
                <el-icon><Plus /></el-icon>
              </el-button>
            </div>

            <el-menu-item
              v-for="list in taskLists"
              :key="list.id"
              :index="`list-${list.id}`"
              class="list-item"
            >
              <el-icon><Folder /></el-icon>
              <span class="list-name">{{ list.name }}</span>
              <el-button
                size="small"
                type="danger"
                link
                @click.stop="handleDeleteList(list)"
                class="delete-list-btn"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-menu-item>

            <el-divider />

            <el-menu-item index="statistics">
              <el-icon><DataAnalysis /></el-icon>
              <span>数据统计</span>
            </el-menu-item>

            <el-menu-item index="tags">
              <el-icon><PriceTag /></el-icon>
              <span>标签管理</span>
            </el-menu-item>
          </el-menu>
        </el-aside>

        <!-- 主内容区：根据 currentModule/activeMenu 动态切换视图 -->
        <el-main class="main-content" @click="handleMainContentClick">
          <!-- 清单模块 -->
          <div v-if="currentModule === 'tasks'">
            <!-- 任务视图 -->
            <div v-if="!['statistics', 'tags'].includes(activeMenu)">
              <div class="content-header">
                <h2>{{ pageTitle }}</h2>
                <div class="content-header-actions">
                  <template v-if="batchMode">
                    <el-button
                      type="danger"
                      :disabled="selectedTaskIds.size === 0"
                      @click="handleBatchDelete"
                    >
                      <el-icon><Delete /></el-icon>
                      删除选中 ({{ selectedTaskIds.size }})
                    </el-button>
                    <el-button @click="handleSelectAll">全选</el-button>
                    <el-button @click="selectedTaskIds.clear()">取消选择</el-button>
                    <el-button @click="exitBatchMode">退出批量模式</el-button>
                  </template>
                  <template v-else>
                    <el-button @click="enterBatchMode">批量操作</el-button>
                    <el-button type="primary" @click="openCreateTaskDialog">
                      <el-icon><Plus /></el-icon>
                      新建任务
                    </el-button>
                  </template>
                </div>
              </div>

              <!-- 搜索框 -->
              <el-input
                v-if="activeMenu === 'all'"
                v-model="searchKeyword"
                placeholder="搜索任务..."
                prefix-icon="Search"
                clearable
                @input="handleSearch"
                style="margin-bottom: 20px"
              />

              <!-- 任务列表 -->
              <el-card v-loading="loading" class="task-card">
                <div class="task-card-inner">
                  <el-empty v-if="tasks.length === 0" description="暂无任务" />
                  <div v-else class="task-list">
                    <div
                      v-for="task in tasks"
                      :key="task.id"
                      class="task-item"
                      :class="{
                        completed: task.status === 1,
                        subtask: task.parentId != null,
                        'batch-selected': batchMode && selectedTaskIds.has(task.id),
                      }"
                      :style="{ paddingLeft: 20 + (task.level || 0) * 30 + 'px' }"
                      @click.stop="batchMode ? toggleTaskSelection(task.id) : handleEditTask(task)"
                    >
                      <el-checkbox
                        v-if="batchMode"
                        :model-value="selectedTaskIds.has(task.id)"
                        @click.stop
                        @change="toggleTaskSelection(task.id)"
                      />
                      <el-checkbox
                        v-else
                        :model-value="task.status === 1"
                        @click.stop
                        @change="handleCompleteTask(task)"
                        :class="'priority-' + task.priority"
                      />
                      <div class="task-content">
                        <div class="task-title">{{ task.title }}</div>
                      </div>
                      <div v-if="!batchMode" class="task-actions">
                        <!-- 时间提示 -->
                        <span
                          :class="['time-status', getTimeStatusClass(task)]"
                          :style="{ visibility: getTimeStatus(task) ? 'visible' : 'hidden' }"
                        >
                          {{ getTimeStatus(task) || ' ' }}
                        </span>
                        <!-- 距离结束剩余天数 -->
                        <span
                          v-if="getDueDaysBadge(task).text"
                          :class="['due-days-badge', getDueDaysClass(task)]"
                        >
                          {{ getDueDaysBadge(task).text }}
                        </span>
                        <el-button
                          v-if="isOverdue(task)"
                          size="small"
                          type="warning"
                          text
                          @click.stop="handlePostponeTask(task)"
                          title="顺延至今天"
                        >
                          顺延
                        </el-button>
                        <el-button size="small" @click.stop="handleDeleteTask(task)">
                          <el-icon><Delete /></el-icon>
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </el-card>
            </div>

            <!-- 数据统计视图 -->
            <div v-else-if="activeMenu === 'statistics'" class="statistics-view">
              <StatisticsView />
            </div>

            <!-- 标签管理视图 -->
            <div v-else-if="activeMenu === 'tags'" class="tags-view">
              <TagsView />
            </div>
          </div>

          <!-- 日历模块 -->
          <div v-else-if="currentModule === 'calendar'" class="calendar-module">
            <CalendarView @task-click="handleCalendarTaskClick" />
          </div>

          <!-- 习惯模块（占位） -->
          <div v-else-if="currentModule === 'habits'" class="habits-module">
            <HabitsView />
          </div>

          <!-- 纪念日模块 -->
          <div v-else-if="currentModule === 'anniversaries'" class="anniversaries-module">
            <AnniversaryList />
          </div>
        </el-main>

        <!-- 右侧编辑面板（固定显示） -->
        <aside v-if="editingTask" class="edit-panel">
          <div class="memo-content">
            <!-- 标题区域 - 可直接编辑 -->
            <div class="memo-header">
              <el-input
                v-model="taskForm.title"
                placeholder="输入任务标题..."
                class="memo-title-input"
                @blur="autoSave"
              />
            </div>

            <!-- 元数据标签区域 -->
            <div class="memo-meta">
              <!-- 优先级 -->
              <el-dropdown @command="handlePriorityChange" trigger="click">
                <el-tag
                  :type="getPriorityType(taskForm.priority) || undefined"
                  size="default"
                  class="meta-tag clickable"
                >
                  <el-icon><Flag /></el-icon>
                  {{ getPriorityText(taskForm.priority) }}优先级
                </el-tag>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="0">无优先级</el-dropdown-item>
                    <el-dropdown-item command="1">低优先级</el-dropdown-item>
                    <el-dropdown-item command="2">中优先级</el-dropdown-item>
                    <el-dropdown-item command="3">高优先级</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>

              <!-- 时间设置 -->
              <el-popover
                trigger="click"
                placement="bottom"
                :width="380"
                @hide="showRepeatForm = false"
              >
                <template #reference>
                  <el-tag
                    size="default"
                    class="meta-tag clickable"
                    :type="
                      taskForm?.startDate || taskForm?.dueDate || editingTask?.repeatRule
                        ? 'warning'
                        : undefined
                    "
                    style="transition: none"
                  >
                    <el-icon><Calendar /></el-icon>
                    {{ getTimeSummary(taskForm, editingTask) }}
                  </el-tag>
                </template>
                <div style="padding: 4px 0">
                  <el-form label-width="70px" size="small">
                    <el-form-item label="开始时间">
                      <el-date-picker
                        v-model="taskForm.startDate"
                        type="datetime"
                        placeholder="未设置"
                        :format="datePickerFormat"
                        value-format="YYYY-MM-DDTHH:mm:ss"
                        style="width: 100%"
                        :teleported="false"
                        @change="autoSave"
                      />
                    </el-form-item>
                    <el-form-item label="截止时间">
                      <el-date-picker
                        v-model="taskForm.dueDate"
                        type="datetime"
                        placeholder="未设置"
                        :format="datePickerFormat"
                        value-format="YYYY-MM-DDTHH:mm:ss"
                        style="width: 100%"
                        :teleported="false"
                        @change="autoSave"
                      />
                    </el-form-item>
                  </el-form>
                  <el-divider style="margin: 8px 0">循环</el-divider>
                  <div v-if="editingTask?.repeatRule">
                    <div style="margin-bottom: 8px; font-size: 13px; color: #e6a23c">
                      🔄 {{ getRepeatLabel(editingTask.repeatRule, editingTask) }}
                    </div>
                    <el-form label-width="70px" size="small">
                      <el-form-item label="结束日期">
                        <el-date-picker
                          v-model="editRepeatEndDate"
                          type="datetime"
                          placeholder="永不结束"
                          :format="datePickerFormat"
                          value-format="YYYY-MM-DDTHH:mm:ss"
                          style="width: 100%"
                          :teleported="false"
                        />
                      </el-form-item>
                    </el-form>
                    <div style="text-align: right; margin-top: 8px">
                      <el-button size="small" type="danger" @click="handleCancelRepeat"
                        >取消循环</el-button
                      >
                      <el-button size="small" type="primary" @click="handleUpdateRepeatEndDate"
                        >更新</el-button
                      >
                    </div>
                  </div>
                  <div v-else>
                    <div v-if="!showRepeatForm" style="text-align: center">
                      <el-button
                        size="small"
                        @click="showRepeatForm = true; resetRepeatForm()"
                        >+ 设置循环</el-button
                      >
                    </div>
                    <div v-else>
                      <el-form label-width="70px" size="small">
                        <el-form-item label="类型">
                          <el-select
                            v-model="repeatForm.type"
                            placeholder="选择"
                            style="width: 100%"
                            :teleported="false"
                            @change="onRepeatTypeChange"
                          >
                            <el-option label="每天" value="DAILY" />
                            <el-option label="每周" value="WEEKLY" />
                            <el-option label="每月" value="MONTHLY" />
                            <el-option label="每年" value="YEARLY" />
                          </el-select>
                        </el-form-item>
                        <el-form-item v-if="repeatForm.type" label="间隔">
                          <el-input-number
                            v-model="repeatForm.interval"
                            :min="1"
                            :max="365"
                            style="width: 100%"
                            size="small"
                          />
                        </el-form-item>
                        <el-form-item v-if="repeatForm.type === 'WEEKLY'" label="星期">
                          <el-checkbox-group v-model="repeatForm.weekDays" size="small">
                            <el-checkbox :value="1">一</el-checkbox>
                            <el-checkbox :value="2">二</el-checkbox>
                            <el-checkbox :value="3">三</el-checkbox>
                            <el-checkbox :value="4">四</el-checkbox>
                            <el-checkbox :value="5">五</el-checkbox>
                            <el-checkbox :value="6">六</el-checkbox>
                            <el-checkbox :value="7">日</el-checkbox>
                          </el-checkbox-group>
                        </el-form-item>
                        <el-form-item v-if="repeatForm.type === 'MONTHLY'" label="日期">
                          <el-input-number
                            v-model="repeatForm.dayOfMonth"
                            :min="1"
                            :max="31"
                            style="width: 100%"
                            size="small"
                          />
                        </el-form-item>
                        <el-form-item v-if="repeatForm.type" label="结束日期">
                          <el-date-picker
                            v-model="repeatForm.endDate"
                            type="datetime"
                            placeholder="永不结束"
                            :format="datePickerFormat"
                            value-format="YYYY-MM-DDTHH:mm:ss"
                            style="width: 100%"
                            :teleported="false"
                          />
                        </el-form-item>
                      </el-form>
                      <div style="text-align: right; margin-top: 8px">
                        <el-button size="small" @click="showRepeatForm = false">取消</el-button>
                        <el-button size="small" type="primary" @click="handleAddRepeatInPanel"
                          >确定</el-button
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </el-popover>

              <!-- 清单 -->
              <el-dropdown @command="handleListChange" trigger="click">
                <el-tag size="default" class="meta-tag clickable" type="success">
                  <el-icon><Folder /></el-icon>
                  {{ getSelectedListName() }}
                </el-tag>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="null">无清单</el-dropdown-item>
                    <el-dropdown-item v-for="list in taskLists" :key="list.id" :command="list.id">
                      {{ list.name }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <!-- 标签 -->
              <el-popover trigger="click" placement="bottom" :width="280">
                <template #reference>
                  <el-tag size="default" class="meta-tag clickable" type="info">
                    <el-icon><PriceTag /></el-icon>
                    {{ taskTags.length > 0 ? `${taskTags.length}个标签` : '标签' }}
                  </el-tag>
                </template>
                <el-select
                  v-model="selectedTagIds"
                  multiple
                  filterable
                  placeholder="选择标签"
                  style="width: 100%"
                  :teleported="false"
                  @change="handleTagChange"
                  @visible-change="loadAllTags"
                >
                  <el-option v-for="tag in allTags" :key="tag.id" :label="tag.name" :value="tag.id">
                    <span
                      :style="{
                        display: 'inline-block',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: tag.color,
                        marginRight: '8px',
                        verticalAlign: 'middle',
                      }"
                    ></span>
                    {{ tag.name }}
                  </el-option>
                </el-select>
              </el-popover>
            </div>

            <!-- 已选标签展示 -->
            <div v-if="taskTags.length > 0" class="task-tags-row">
              <el-tag
                v-for="tag in taskTags"
                :key="tag.id"
                :color="tag.color"
                :style="{
                  backgroundColor: tag.color,
                  borderColor: tag.color,
                  color: '#fff',
                  marginRight: '6px',
                  marginBottom: '4px',
                }"
                size="small"
                closable
                @close="handleRemoveTag(tag.id, editingTask)"
              >
                {{ tag.name }}
              </el-tag>
            </div>

            <!-- 描述区域 -->
            <div class="memo-description">
              <div class="section-header">
                <h4 class="section-title">描述</h4>
                <el-switch
                  v-model="descriptionPreview"
                  size="small"
                  active-text="预览"
                  inactive-text="编辑"
                />
              </div>
              <el-input
                v-if="!descriptionPreview"
                v-model="taskForm.description"
                type="textarea"
                :rows="8"
                placeholder="添加详细描述...（支持 Markdown）"
                class="memo-textarea"
                @blur="autoSave"
              />
              <div v-else class="markdown-preview" v-html="renderMarkdown(taskForm.description)" />
            </div>

            <!-- 子任务区域 -->
            <div class="memo-subtasks">
              <h4 class="section-title">子任务</h4>
              <el-empty
                v-if="!taskForm.subtasks || taskForm.subtasks.length === 0"
                description="暂无子任务"
                :image-size="60"
              />
              <div v-else class="subtask-list">
                <div
                  v-for="(subtask, index) in taskForm.subtasks"
                  :key="index"
                  class="subtask-item"
                >
                  <el-checkbox v-model="subtask.completed" @change="autoSave" />
                  <el-input
                    v-model="subtask.title"
                    size="small"
                    class="subtask-input"
                    @blur="autoSave"
                    @keyup.enter="handleSubtaskEnter(index)"
                  />
                  <el-button size="small" type="danger" link @click="removeSubtask(index)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
              <el-button type="primary" text @click="addSubtask" style="margin-top: 10px">
                <el-icon><Plus /></el-icon>
                添加子任务
              </el-button>
            </div>

            <!-- 附件区域 -->
            <div class="memo-attachments">
              <h4 class="section-title">附件</h4>
              <div class="attachment-upload">
                <input
                  ref="fileInputRef"
                  type="file"
                  style="display: none"
                  @change="(e: Event) => handleFileSelect(e, editingTask)"
                />
                <el-button size="small" @click="triggerFileUpload" :loading="attachmentUploading">
                  <el-icon><Upload /></el-icon>
                  上传文件
                </el-button>
                <span class="upload-hint">最大 10MB</span>
              </div>
              <div v-if="taskAttachments.length > 0" class="attachment-list">
                <div v-for="att in taskAttachments" :key="att.id" class="attachment-item">
                  <span class="attachment-name">{{ att.fileName }}</span>
                  <span class="attachment-size">{{ formatFileSize(att.fileSize) }}</span>
                  <el-button size="small" type="primary" link @click="downloadAttachment(att)">
                    <el-icon><Download /></el-icon>
                  </el-button>
                  <el-button size="small" type="danger" link @click="handleDeleteAttachment(att, editingTask)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
              <el-empty v-else description="暂无附件" :image-size="40" />
            </div>
          </div>
        </aside>
      </el-container>
    </el-container>

    <!-- 新建任务对话框（保持对话框形式） -->
    <el-dialog v-model="showCreateTaskDialog" title="新建任务" width="600px">
      <el-form :model="taskForm" :rules="taskRules" ref="taskFormRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="taskForm.title" placeholder="请输入任务标题" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="taskForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入任务描述"
          />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="taskForm.priority" placeholder="请选择优先级">
            <el-option label="无" :value="0" />
            <el-option label="低" :value="1" />
            <el-option label="中" :value="2" />
            <el-option label="高" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间设置">
          <el-popover
            trigger="click"
            placement="bottom"
            :width="380"
            @hide="showRepeatForm = false"
          >
            <template #reference>
              <el-tag
                size="default"
                :type="
                  taskForm?.startDate || taskForm?.dueDate || repeatForm.type ? 'warning' : 'info'
                "
                style="cursor: pointer"
              >
                <el-icon><Calendar /></el-icon>
                {{ getCreateTimeSummary(taskForm, repeatForm) }}
              </el-tag>
            </template>
            <div style="padding: 4px 0">
              <el-radio-group
                v-model="taskTimeMode"
                size="small"
                style="margin-bottom: 12px"
                @change="onModeChange"
              >
                <el-radio-button value="normal">🕒 普通任务</el-radio-button>
                <el-radio-button value="repeat">🔄 循环任务</el-radio-button>
              </el-radio-group>

              <!-- 普通模式：开始 + 截止 -->
              <template v-if="taskTimeMode === 'normal'">
                <el-form label-width="80px" size="small">
                  <el-form-item label="开始时间">
                    <el-date-picker
                      v-model="taskForm.startDate"
                      type="datetime"
                      placeholder="未设置"
                      :format="datePickerFormat"
                      value-format="YYYY-MM-DDTHH:mm:ss"
                      style="width: 100%"
                      :teleported="false"
                    />
                  </el-form-item>
                  <el-form-item label="截止时间">
                    <el-date-picker
                      v-model="taskForm.dueDate"
                      type="datetime"
                      placeholder="未设置"
                      :format="datePickerFormat"
                      value-format="YYYY-MM-DDTHH:mm:ss"
                      style="width: 100%"
                      :teleported="false"
                    />
                  </el-form-item>
                </el-form>
              </template>

              <!-- 循环模式：周期基准 + 循环规则 -->
              <template v-else>
                <el-form label-width="90px" size="small">
                  <el-form-item label="周期基准">
                    <el-date-picker
                      v-model="taskForm.dueDate"
                      type="datetime"
                      placeholder="未设置"
                      :format="datePickerFormat"
                      value-format="YYYY-MM-DDTHH:mm:ss"
                      style="width: 100%"
                      :teleported="false"
                    />
                    <div style="font-size: 12px; color: #909399; line-height: 1.4; margin-top: 2px">
                      首次发生时间，下次循环以此为基准
                    </div>
                  </el-form-item>
                </el-form>
                <el-divider style="margin: 8px 0">循环规则</el-divider>
                <div v-if="!repeatForm.type" style="text-align: center">
                  <el-button
                    size="small"
                    @click="repeatForm.type = 'DAILY'; onRepeatTypeChange()"
                    >+ 设置循环</el-button
                  >
                </div>
                <div v-else>
                  <el-form label-width="90px" size="small">
                    <el-form-item label="类型">
                      <el-select
                        v-model="repeatForm.type"
                        style="width: 100%"
                        :teleported="false"
                        @change="onRepeatTypeChange"
                      >
                        <el-option label="每天" value="DAILY" /><el-option
                          label="每周"
                          value="WEEKLY"
                        /><el-option label="每月" value="MONTHLY" /><el-option
                          label="每年"
                          value="YEARLY"
                        />
                      </el-select>
                      <el-button
                        size="small"
                        type="danger"
                        text
                        style="margin-left: 4px"
                        @click="repeatForm.type = ''; resetRepeatForm()"
                        >取消循环</el-button
                      >
                    </el-form-item>
                    <el-form-item v-if="repeatForm.type" label="间隔">
                      <el-input-number
                        v-model="repeatForm.interval"
                        :min="1"
                        :max="365"
                        style="width: 100%"
                        size="small"
                      />
                    </el-form-item>
                    <el-form-item v-if="repeatForm.type === 'WEEKLY'" label="星期">
                      <el-checkbox-group v-model="repeatForm.weekDays" size="small">
                        <el-checkbox :value="1">一</el-checkbox
                        ><el-checkbox :value="2">二</el-checkbox
                        ><el-checkbox :value="3">三</el-checkbox>
                        <el-checkbox :value="4">四</el-checkbox
                        ><el-checkbox :value="5">五</el-checkbox
                        ><el-checkbox :value="6">六</el-checkbox
                        ><el-checkbox :value="7">日</el-checkbox>
                      </el-checkbox-group>
                    </el-form-item>
                    <el-form-item v-if="repeatForm.type === 'MONTHLY'" label="日期">
                      <el-input-number
                        v-model="repeatForm.dayOfMonth"
                        :min="1"
                        :max="31"
                        style="width: 100%"
                        size="small"
                      />
                    </el-form-item>
                    <el-form-item v-if="repeatForm.type" label="循环结束">
                      <el-date-picker
                        v-model="repeatForm.endDate"
                        type="datetime"
                        placeholder="永不结束"
                        :format="datePickerFormat"
                        value-format="YYYY-MM-DDTHH:mm:ss"
                        style="width: 100%"
                        :teleported="false"
                      />
                      <div
                        style="font-size: 12px; color: #909399; line-height: 1.4; margin-top: 2px"
                      >
                        该日期之后不再生成新循环任务
                      </div>
                    </el-form-item>
                  </el-form>
                  <div style="text-align: right; margin-top: 8px">
                    <el-button
                      size="small"
                      @click="repeatForm.type = ''; resetRepeatForm()"
                      >取消</el-button
                    >
                    <el-button
                      size="small"
                      type="primary"
                      @click="handleSubmitTask"
                      :loading="submitLoading"
                      >确定</el-button
                    >
                  </div>
                </div>
              </template>
            </div>
          </el-popover>
        </el-form-item>
        <el-form-item label="清单" prop="listId">
          <el-select v-model="taskForm.listId" placeholder="选择清单" clearable>
            <el-option
              v-for="list in taskLists"
              :key="list.id"
              :label="list.name"
              :value="list.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateTaskDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitTask" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 创建清单对话框 -->
    <el-dialog v-model="showCreateListDialog" title="新建清单" width="400px">
      <el-form :model="listForm" :rules="listRules" ref="listFormRef" label-width="60px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="listForm.name" placeholder="请输入清单名称" />
        </el-form-item>
        <el-form-item label="颜色" prop="color">
          <el-color-picker v-model="listForm.color" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateListDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitList" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * Dashboard 核心逻辑：由多个独立 composable 组合而成，
 * 本组件负责协调它们之间的数据流和事件传递。
 * - useTaskSync: Tauri 多窗口同步
 * - useTaskCrud: 任务列表 CRUD 和树构建
 * - useTaskEdit: 编辑面板状态和自动保存
 * - useSubtasks: 子任务管理
 * - useTags: 标签 CRUD 和任务-标签关联
 * - useAttachments: 附件上传/下载/删除
 * - useLists: 清单 CRUD
 * - useBatchOps: 批量选择/删除
 * - useReminders: 纪念日提醒轮询
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  List,
  Calendar,
  Clock,
  Plus,
  Folder,
  Delete,
  DataAnalysis,
  PriceTag,
  TrendCharts,
  Flag,
  Bell,
  Upload,
  Download,
  Switch as SwitchIcon,
} from '@element-plus/icons-vue'
import * as anniversaryApi from '../api/anniversary'
import { isOverdue } from '../composables/useDateUtils'
import { getPriorityType, getPriorityText } from '../composables/usePriority'
import { useTaskSync } from '../composables/useTaskSync'
import { useTaskCrud } from '../composables/useTaskCrud'
import { useTaskEdit } from '../composables/useTaskEdit'
import { useSubtasks } from '../composables/useSubtasks'
import { useTags } from '../composables/useTags'
import { useAttachments } from '../composables/useAttachments'
import { useLists } from '../composables/useLists'
import { useBatchOps } from '../composables/useBatchOps'
import { useReminders } from '../composables/useReminders'
import { getTimeStatus, getTimeStatusClass, getDueDaysBadge, getDueDaysClass, formatFileSize, renderMarkdown, getTimeSummary, getCreateTimeSummary } from '../composables/useTimeUtils'
import { getRepeatLabel } from '../composables/useRepeatRule'
import StatisticsView from '../components/StatisticsView.vue'
import TagsView from '../components/TagsView.vue'
import CalendarView from '../components/CalendarView.vue'
import HabitsView from '../components/HabitsView.vue'
import AnniversaryList from '../components/AnniversaryList.vue'
import type { Task, TaskList, Tag } from '../types'

// ── 导航状态 ──
const currentModule = ref('tasks') // 当前模块: tasks, calendar, habits, anniversaries
const activeMenu = ref('all')

// ── 认证 ──
const router = useRouter()
const authStore = useAuthStore()

/** 登出：清除会话并跳转到登录页 */
function handleLogout() {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    authStore.logout()
    router.push('/login')
    ElMessage.success('已退出登录')
  }).catch(() => {
    // 用户取消，不做操作
  })
}

// ── 组合式函数初始化 ──
/** 跨窗口任务同步（Tauri 环境） */
const { emitTaskChanged } = useTaskSync(() => loadTasks())

const taskCrud = useTaskCrud()
const {
  tasks, loading, total, currentPage, pageSize, searchKeyword,
  taskTree, loadTasks, handleToggleTask, handleDeleteTask: handleDeleteTaskFromCmp, handlePostponeTask,
} = taskCrud
// Wrapper: template calls handleDeleteTask(task), composable expects (task, showUndo, emitTaskChanged)
const handleDeleteTask = (task: Task) => handleDeleteTaskFromCmp(task, showUndo, emitTaskChanged)

const taskEdit = useTaskEdit(loadTasks, emitTaskChanged)
const {
  editingTask, showCreateTaskDialog, submitLoading, isSaving, descriptionPreview,
  taskFormRef, taskForm, taskTags, taskAttachments, selectedTagIds,
  repeatForm, editRepeatEndDate, showRepeatForm, taskTimeMode,
  datePickerFormat, taskRules,
  openCreateTaskDialog, handleEditTask, handleCalendarTaskClick,
  handleMainContentClick, closeEditPanel, flushAndSave, autoSave, doSave,
  handlePriorityChange, handleListChange, getSelectedListName: getSelectedListNameFromCmp,
  handleSubmitTask, handleCompleteTask, resetTaskForm,
  resetRepeatForm, onRepeatTypeChange, onModeChange,
  handleAddRepeatInPanel, handleUpdateRepeatEndDate, handleCancelRepeat,
} = taskEdit

const {
  addSubtask, removeSubtask, handleSubtaskEnter,
} = useSubtasks(taskForm, autoSave)

const tagsMgmt = useTags()
const { allTags, loadAllTags, handleTagChange, handleRemoveTag } = tagsMgmt

const attachmentsMgmt = useAttachments()
const {
  attachmentUploading, fileInputRef, triggerFileUpload,
  handleFileSelect, downloadAttachment, handleDeleteAttachment,
} = attachmentsMgmt

const listsMgmt = useLists()
const {
  taskLists, showCreateListDialog,
  listFormRef, listForm, listRules, submitLoading: listSubmitLoading,
  loadLists, resetListForm, handleSubmitList, handleDeleteList: handleDeleteListFromCmp,
} = listsMgmt
// Wrapper: template calls handleDeleteList(list), composable expects (list, activeMenu, setActiveMenu, loadTasks)
const handleDeleteList = (list: TaskList) => handleDeleteListFromCmp(list, activeMenu, (v: string) => { activeMenu.value = v }, loadTasks)
// Wrapper: template calls getSelectedListName() with no args, composable expects taskLists parameter
const getSelectedListName = () => getSelectedListNameFromCmp(taskLists.value)

const batchOps = useBatchOps(tasks)
const {
  batchMode, selectedTaskIds, enterBatchMode, exitBatchMode,
  toggleTaskSelection, handleSelectAll, handleBatchDelete: handleBatchDeleteFromCmp,
} = batchOps
// Wrapper: template calls handleBatchDelete (no args), composable expects (loadTasks, emitTaskChanged)
const handleBatchDelete = () => handleBatchDeleteFromCmp(loadTasks, emitTaskChanged)

const remindersMgmt = useReminders()
const {
  reminders, unreadReminderCount, loadReminders,
  getReminderName, formatReminderTime,
  onMountedReminders, onUnmountedReminders,
} = remindersMgmt

// ── 计算属性 ──

/** 根据当前 activeMenu 获取页面标题 */
const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    all: '全部任务',
    today: '今日任务',
    upcoming: '未来任务',
    statistics: '数据统计',
    tags: '标签管理',
  }
  if (activeMenu.value.startsWith('list-')) {
    const listId = parseInt(activeMenu.value.split('-')[1])
    const list = taskLists.value.find((l: TaskList) => l.id === listId)
    return list ? list.name : '清单'
  }
  return titles[activeMenu.value] || '全部任务'
})

// ── 方法 ──

/** 侧边栏菜单选择：切换 activeMenu，重置分页，加载任务 */
const handleMenuSelect = (index: string) => {
  activeMenu.value = index
  currentPage.value = 1
  loadTasks()
}

// 搜索任务
const handleSearch = () => {
  currentPage.value = 1
  loadTasks()
}

// 撤销通知
const showUndo = (label: string, callback: () => void) => {
  ElMessage({
    message: label,
    type: 'success',
    duration: 4000,
    showClose: false,
    customClass: 'undo-message',
    onClose: () => {
      /* undo expired */
    },
  })
  setTimeout(() => {
    const messages = document.querySelectorAll('.el-message--success')
    messages.forEach((el) => {
      if (el.textContent?.includes(label) && !el.querySelector('.undo-link')) {
        const btn = document.createElement('span')
        btn.textContent = '撤销'
        btn.className = 'undo-link'
        btn.style.cssText =
          'margin-left:12px;color:#e6a23c;cursor:pointer;font-weight:500;text-decoration:underline'
        btn.onclick = () => {
          callback()
          el.remove()
        }
        el.appendChild(btn)
      }
    })
  }, 50)
}

const handleReminderClick = async (r: { id: number; isRead: boolean; anniversaryId: number; remindDatetime: string }) => {
  if (!r.isRead) {
    await anniversaryApi.markReminderRead(r.id)
    await loadReminders()
  }
  currentModule.value = 'anniversaries'
}

onMounted(async () => {
  loadLists()
  loadTasks()
  onMountedReminders()
})

// 切换模块时退出批量模式
watch(currentModule, () => {
  if (batchMode.value) exitBatchMode()
})

onUnmounted(() => {
  onUnmountedReminders()
})

</script>

<style scoped>
.dashboard-container {
  height: calc(100vh - var(--titlebar-height, 0px));
  overflow: hidden;
  flex: 1;
}

/* 图标导航栏 */
.icon-sidebar {
  background: #1a1a2e;
  border-right: none;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.icon-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;
  flex: 1;
}

.icon-nav-bottom {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;
  border-top: 1px solid rgba(255,255,255,0.08);
}

.nav-item {
  width: 48px;
  height: 48px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  cursor: pointer;
  color: #999;
  transition: all 0.3s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.nav-item.active {
  background: #667eea;
  color: #fff;
}

/* 内层容器 */
.el-container {
  height: 100%;
  display: flex;
}

.sidebar {
  background: #fff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow-y: auto;
}

.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.logo h2 {
  margin: 0;
  color: #667eea;
  font-size: 18px;
}

.el-menu {
  flex: 1;
  border-right: none;
  overflow-y: auto;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  font-weight: bold;
  color: #606266;
  flex-shrink: 0;
}

.list-item {
  position: relative;
}

.list-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-list-btn {
  opacity: 0;
  transition: opacity 0.3s;
  margin-left: auto;
}

.list-item:hover .delete-list-btn {
  opacity: 1;
}

.main-content {
  background: #f5f5f5;
  padding: 20px;
  overflow-y: auto;
  height: 100%;
  flex: 1;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.content-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.content-header h2 {
  margin: 0;
  font-size: 20px;
}

.task-list {
  overflow-y: auto;
  padding: 0;
  flex: 1;
}

.task-card {
  display: flex;
  flex-direction: column;
}

.task-card :deep(.el-card__body) {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.task-card-inner {
  display: flex;
  flex-direction: column;
}

/* 右侧编辑面板 */
.edit-panel {
  width: 500px;
  height: 100%;
  background: #fff;
  border-left: 1px solid #e8e8e8;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.05);
  overflow-y: auto;
  flex-shrink: 0;
  position: sticky;
  top: 0;
}

.task-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.3s;
  cursor: pointer;
}

.task-item :deep(.el-checkbox) {
  margin-top: 0;
  display: flex;
  align-items: center;
}

.task-item:hover {
  background-color: #f9f9f9;
}

.task-item.batch-selected {
  background-color: #ecf5ff;
  outline: 1px solid #409eff;
}

.task-item.completed .task-title {
  text-decoration: line-through;
  color: #999;
}

.task-item.subtask {
  background-color: #f8f9fa;
}

.task-content {
  flex: 1;
  margin-left: 10px;
}

.task-title {
  font-weight: 500;
  margin-bottom: 5px;
}

.task-desc {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.task-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

/* 时间状态样式 */
.time-status {
  font-size: 13px;
  font-weight: 500;
  min-width: 80px;
  text-align: right;
  margin-right: 8px;
  display: inline-block;
}

.time-status-upcoming {
  color: #409eff;
}

.time-status-active {
  color: #409eff;
}

.time-status-overdue {
  color: #f56c6c;
}

.time-status-today {
  color: #e6a23c;
}

/* 距离结束剩余天数徽章 */
.due-days-badge {
  font-size: 13px;
  font-weight: 500;
  min-width: 80px;
  text-align: right;
  margin-right: 8px;
  display: inline-block;
  white-space: nowrap;
}

.due-days-badge-upcoming {
  color: #409eff;
}

.due-days-badge-today {
  color: #e6a23c;
  font-weight: 600;
}

.due-days-badge-overdue {
  color: #f56c6c;
}

.task-actions {
  display: flex;
  gap: 5px;
  align-items: center;
}

/* 优先级颜色 */
.priority-0 :deep(.el-checkbox__inner) {
  background-color: #fff;
  border-color: #909399;
}

.priority-0 :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #fff;
  border-color: #909399;
}

.priority-0 :deep(.el-checkbox__input.is-checked .el-checkbox__inner::after) {
  border-color: #909399;
}

.priority-1 :deep(.el-checkbox__inner) {
  background-color: #fff;
  border-color: #409eff;
}

.priority-1 :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #fff;
  border-color: #409eff;
}

.priority-1 :deep(.el-checkbox__input.is-checked .el-checkbox__inner::after) {
  border-color: #409eff;
}

.priority-2 :deep(.el-checkbox__inner) {
  background-color: #fff;
  border-color: #e6a23c;
}

.priority-2 :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #fff;
  border-color: #e6a23c;
}

.priority-2 :deep(.el-checkbox__input.is-checked .el-checkbox__inner::after) {
  border-color: #e6a23c;
}

.priority-3 :deep(.el-checkbox__inner) {
  background-color: #fff;
  border-color: #f56c6c;
}

.priority-3 :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #fff;
  border-color: #f56c6c;
}

.priority-3 :deep(.el-checkbox__input.is-checked .el-checkbox__inner::after) {
  border-color: #f56c6c;
}

/* 统计和标签视图 */
.statistics-view,
.tags-view {
  height: 100%;
  overflow-y: auto;
}

/* 日历模块 */
.calendar-module {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 习惯模块 */
.habits-module {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 纪念日模块 */
.anniversaries-module {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.bell-btn {
  position: relative;
}

.reminder-popover h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #303133;
}
.reminder-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}
.reminder-item {
  padding: 10px;
  border-radius: 6px;
  background: #f5f7fa;
  cursor: pointer;
  transition: background 0.2s;
}
.reminder-item:hover {
  background: #ecf5ff;
}
.reminder-name {
  font-weight: 500;
  font-size: 14px;
  color: #303133;
}
.reminder-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 占位模块 */
.placeholder-module {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 编辑抽屉样式 - 备忘录风格 */
.memo-drawer :deep(.el-drawer__body) {
  padding: 0;
}

.memo-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 24px;
  background: #fff;
}

/* 标题区域 */
.memo-header {
  margin-bottom: 16px;
}

.memo-title-input :deep(.el-input__wrapper) {
  box-shadow: none;
  padding: 0;
  background: transparent;
}

.memo-title-input :deep(.el-input__inner) {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.memo-title-input :deep(.el-input__inner)::placeholder {
  color: #c0c4cc;
}

/* 元数据标签区域 */
.memo-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.meta-tag {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-tag.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.meta-tag :deep(.el-icon) {
  font-size: 14px;
}

/* 描述区域 */
.memo-description {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 0;
}

.section-header .section-title {
  margin-bottom: 0;
}

.markdown-preview {
  min-height: 120px;
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
}

.markdown-preview :deep(h1) {
  font-size: 1.5em;
  margin: 0.5em 0;
}
.markdown-preview :deep(h2) {
  font-size: 1.3em;
  margin: 0.5em 0;
}
.markdown-preview :deep(h3) {
  font-size: 1.1em;
  margin: 0.4em 0;
}
.markdown-preview :deep(p) {
  margin: 0.5em 0;
}
.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  padding-left: 1.5em;
  margin: 0.5em 0;
}
.markdown-preview :deep(code) {
  background: #eee;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
}
.markdown-preview :deep(pre) {
  background: #f0f0f0;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}
.markdown-preview :deep(pre code) {
  background: none;
  padding: 0;
}
.markdown-preview :deep(blockquote) {
  border-left: 3px solid #ddd;
  padding-left: 12px;
  color: #666;
  margin: 0.5em 0;
}
.markdown-preview :deep(a) {
  color: #409eff;
}

.memo-textarea :deep(.el-textarea__inner) {
  border: none;
  box-shadow: none;
  padding: 0;
  font-size: 15px;
  line-height: 1.8;
  color: #606266;
  resize: none;
  background: transparent;
}

.memo-textarea :deep(.el-textarea__inner)::placeholder {
  color: #c0c4cc;
}

/* 子任务区域 */
.memo-subtasks {
  border-top: 1px solid #e8e8e8;
  padding-top: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.subtask-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subtask-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  transition: all 0.3s;
}

.subtask-item:hover {
  background: #ecf5ff;
}

.subtask-input {
  flex: 1;
}

.subtask-input :deep(.el-input__wrapper) {
  box-shadow: none;
  padding: 0 8px;
  background: transparent;
}

.subtask-input :deep(.el-input__inner) {
  font-size: 14px;
  color: #606266;
}

.subtask-text {
  flex: 1;
  font-size: 14px;
  color: #606266;
}

.subtask-text.completed {
  text-decoration: line-through;
  color: #c0c4cc;
}

/* 标签行 */
.task-tags-row {
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

/* 附件区域 */
.memo-attachments {
  border-top: 1px solid #e8e8e8;
  padding-top: 20px;
  max-height: 200px;
  overflow-y: auto;
}

.attachment-upload {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.upload-hint {
  font-size: 12px;
  color: #c0c4cc;
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.attachment-item:hover {
  background: #ecf5ff;
}

.attachment-name {
  flex: 1;
  font-size: 13px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-size {
  font-size: 12px;
  color: #909399;
}
</style>
