import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { RequestWithUser } from 'src/common/decorators/interfaces/active-user.interface';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  private getUserId(request: RequestWithUser): string {
    const userId = request.user?.id;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    return userId;
  }

  @Post('workspaces/:wsId/tasks')
  create(
    @Req() req: RequestWithUser,
    @Param('wsId') wsId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(this.getUserId(req), wsId, dto);
  }

  @Get('workspaces/:wsId/tasks')
  findAll(
    @Req() req: RequestWithUser,
    @Param('wsId') wsId: string,
    @Query() query: ListTasksQueryDto,
  ) {
    return this.tasksService.findAll(this.getUserId(req), wsId, query);
  }

  @Get('tasks/:taskId')
  findOne(@Req() req: RequestWithUser, @Param('taskId') taskId: string) {
    return this.tasksService.findOne(this.getUserId(req), taskId);
  }

  @Patch('tasks/:taskId')
  update(
    @Req() req: RequestWithUser,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(this.getUserId(req), taskId, dto);
  }

  @Delete('tasks/:taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: RequestWithUser, @Param('taskId') taskId: string) {
    return this.tasksService.remove(this.getUserId(req), taskId);
  }
}
