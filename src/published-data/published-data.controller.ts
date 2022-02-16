import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
} from "@nestjs/common";
import { PublishedDataService } from "./published-data.service";
import { CreatePublishedDataDto } from "./dto/create-published-data.dto";
import { UpdatePublishedDataDto } from "./dto/update-published-data.dto";
import { ApiBearerAuth, ApiQuery, ApiTags } from "@nestjs/swagger";
import { PoliciesGuard } from "src/casl/guards/policies.guard";
import { CheckPolicies } from "src/casl/decorators/check-policies.decorator";
import { AppAbility } from "src/casl/casl-ability.factory";
import { Action } from "src/casl/action.enum";
import {
  PublishedData,
  PublishedDataDocument,
} from "./schemas/published-data.schema";
import {
  ICount,
  IPublishedDataFilters,
} from "./interfaces/published-data.interface";
import { AllowAny } from "src/auth/decorators/allow-any.decorator";
import { RegisteredInterceptor } from "./interceptors/registered.interceptor";
import { FilterQuery } from "mongoose";

@ApiBearerAuth()
@ApiTags("published data")
@Controller("publisheddata")
export class PublishedDataController {
  constructor(private readonly publishedDataService: PublishedDataService) {}

  // POST /publisheddata
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Create, PublishedData),
  )
  @Post()
  async create(
    @Body() createPublishedDataDto: CreatePublishedDataDto,
  ): Promise<PublishedData> {
    return this.publishedDataService.create(createPublishedDataDto);
  }

  // GET /publisheddata
  @AllowAny()
  @UseInterceptors(RegisteredInterceptor)
  @Get()
  @ApiQuery({
    name: "filter",
    description: "Database filters to apply when retrieve all published data",
    required: false,
  })
  async findAll(@Query("filter") filter?: string): Promise<PublishedData[]> {
    const publishedDataFilters: IPublishedDataFilters = JSON.parse(
      filter ?? "{}",
    );
    return this.publishedDataService.findAll(publishedDataFilters);
  }

  // GET /publisheddata/count
  @AllowAny()
  @UseInterceptors(RegisteredInterceptor)
  @Get("/count")
  @ApiQuery({
    name: "filter",
    description: "Database filters to apply when retrieve published data count",
    required: false,
  })
  async count(
    @Query() filter?: { filter: string; fields: string },
  ): Promise<ICount> {
    const jsonFilters: IPublishedDataFilters =
      filter && filter.filter ? JSON.parse(filter.filter) : {};
    const jsonFields: FilterQuery<PublishedDataDocument> =
      filter && filter.fields ? JSON.parse(filter.fields) : {};
    const whereFilters: FilterQuery<PublishedDataDocument> = {
      ...(jsonFilters && jsonFilters.where ? jsonFilters.where : {}),
      ...jsonFields,
    } ?? {
      ...jsonFields,
    };
    const publishedDataFilters: IPublishedDataFilters = {
      where: whereFilters,
    };
    if (jsonFilters && jsonFilters.limits) {
      publishedDataFilters.limits = jsonFilters.limits;
    }
    return this.publishedDataService.count(publishedDataFilters);
  }

  // GET /publisheddata/:id
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Read, PublishedData),
  )
  @Get("/:id")
  async findOne(@Param("id") id: string): Promise<PublishedData | null> {
    return this.publishedDataService.findOne({ doi: id });
  }

  // PATCH /publisheddata/:id
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Update, PublishedData),
  )
  @Patch("/:id")
  async update(
    @Param("id") id: string,
    @Body() updatePublishedDataDto: UpdatePublishedDataDto,
  ): Promise<PublishedData | null> {
    return this.publishedDataService.update(
      { doi: id },
      updatePublishedDataDto,
    );
  }

  // DELETE /publisheddata/:id
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Delete, PublishedData),
  )
  @Delete("/:id")
  async remove(@Param("id") id: string): Promise<unknown> {
    return this.publishedDataService.remove({ doi: id });
  }
}