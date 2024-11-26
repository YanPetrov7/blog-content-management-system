import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { Category } from './entities';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { OperationResultDto } from '../dto';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async findAllCategories(): Promise<Category[]> {
    return this.categoryService.findAll();
  }

  @Get(':id')
  async findCategory(@Param('id') id: number): Promise<Category> {
    return this.categoryService.findOne(id);
  }

  @Post()
  async createCategory(
    @Body() dto: CreateCategoryDto,
  ): Promise<OperationResultDto> {
    return this.categoryService.create(dto);
  }

  @Put(':id')
  async updateCategory(
    @Param('id') id: number,
    @Body() dto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  async removeCategory(@Param('id') id: number): Promise<OperationResultDto> {
    return this.categoryService.remove(id);
  }
}
