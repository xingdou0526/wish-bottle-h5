import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CreateWishSchema,
  UpdateWishSchema,
  type CreateWishDto,
  type UpdateWishDto,
} from '@wishbottle/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser, JwtUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WishesService } from './wishes.service';

@UseGuards(JwtAuthGuard)
@Controller('wishes')
export class WishesController {
  constructor(private readonly wishes: WishesService) {}

  @Post()
  create(
    @CurrentUser() me: JwtUser,
    @Body(new ZodValidationPipe(CreateWishSchema)) dto: CreateWishDto,
  ) {
    return this.wishes.create(me.id, dto);
  }

  @Get()
  list(
    @CurrentUser() me: JwtUser,
    @Query('scope') scope?: 'mine' | 'friend',
    @Query('status') status?: 'pending' | 'sealed' | 'done',
  ) {
    return this.wishes.list(me.id, scope ?? 'mine', status);
  }

  @Get(':id')
  getOne(@CurrentUser() me: JwtUser, @Param('id') id: string) {
    return this.wishes.getOne(me.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() me: JwtUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateWishSchema)) dto: UpdateWishDto,
  ) {
    return this.wishes.update(me.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() me: JwtUser, @Param('id') id: string) {
    return this.wishes.remove(me.id, id);
  }
}
