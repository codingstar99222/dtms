import { Global, Module } from '@nestjs/common';
import { TimeService } from './time.service';

@Global() // Makes TimeService available everywhere
@Module({
  providers: [TimeService],
  exports: [TimeService],
})
export class TimeModule {}
