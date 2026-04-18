import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Standard API heartbeat route. Used by load balancers to confirm the Node.js process is responsive.
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Deep health check route verifying database connectivity.
  // TODO: [Feature - Security] In a strict production environment, consider protecting this route or obscuring the database metrics (like user count) from public access.
  @Get('db-test')
  async getDbTest() {
    return this.appService.testDatabaseConnection();
  }
}
