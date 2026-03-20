import { SetMetadata } from '@nestjs/common';

export const AllowAll = () => SetMetadata('allowAll', true);
