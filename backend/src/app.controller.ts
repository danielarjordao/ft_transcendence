import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // New route to access the database test
  @Get('db-test')
  async getDbTest() {
    return this.appService.testDatabaseConnection();
  }
}
