"use server";

import { requireUser } from "@/server/auth/requireUser";
import { CLIENTS_PAGE_SIZE } from "@/domain/clients/constants";
import { createRequestContext } from "@/server/application/context";
import * as clientsService from "@/server/application/clients/service";

type ListClientsParams = {
  page: number;
  pageSize?: number;
  search?: string;
};

export async function listClientsAction(params: ListClientsParams) {
  const user = await requireUser();
  const ctx = await createRequestContext(user);
  const pageSize = params.pageSize ?? CLIENTS_PAGE_SIZE;

  const listParams = {
    page: params.page,
    pageSize,
    ...(params.search !== undefined && { search: params.search }),
  };

  return clientsService.listPage(ctx, listParams);
}
