import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { InAppNotificationsService } from "./in-app-notifications.service";
import { ListNotificationsQueryDto } from "./dto/list-notifications.dto";
import type { InAppNotificationType } from "./in-app-notification.types";

@Controller("notifications")
@UseGuards(SupabaseAuthGuard)
export class InAppNotificationsController {
  constructor(private readonly notifications: InAppNotificationsService) {}

  @Get("mine")
  listMine(
    @CurrentUser() user: AuthUser,
    @Query() query: ListNotificationsQueryDto,
  ) {
    const types = query.types
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) as InAppNotificationType[] | undefined;

    return this.notifications.listMine(user.id, {
      limit: query.limit,
      unreadOnly: query.unreadOnly,
      undismissedOnly: query.undismissedOnly,
      types,
    });
  }

  @Get("unread-count")
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.notifications.getUnreadCount(user.id);
  }

  @Patch(":id/read")
  markRead(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.notifications.markRead(user.id, id);
  }

  @Patch(":id/dismiss")
  dismiss(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.notifications.dismiss(user.id, id);
  }

  @Post("mark-all-read")
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notifications.markAllRead(user.id);
  }
}
