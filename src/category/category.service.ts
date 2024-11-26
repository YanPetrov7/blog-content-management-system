import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationResultDto } from '../dto';
import { Category } from './entities';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find();
  }

  async findOne(id: number): Promise<Category> {
    const Category = await this.categoryRepository.findOneBy({ id });

    if (!Category) {
      throw new NotFoundException(`Category with id: ${id} not found`);
    }

    return Category;
  }

  async create(dto: CreateCategoryDto): Promise<OperationResultDto> {
    const existingCategory = await this.categoryRepository.findOneBy({
      name: dto.name,
    });

    if (existingCategory) {
      throw new ConflictException('Category with such name already exists');
    }

    const newCategory: Category = this.categoryRepository.create(dto);

    this.categoryRepository.save(newCategory);

    const result: OperationResultDto = {
      status: 'success',
      message: 'Category created successfully',
    };

    return result;
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category) {
      throw new NotFoundException(`Category with id: "${id}" not found`);
    }

    await this.categoryRepository.update({ id }, dto);

    const updatedCategory = await this.categoryRepository.findOneBy({ id });

    return updatedCategory;
  }

  async remove(id: number): Promise<OperationResultDto> {
    const category = await this.categoryRepository.findOneBy({ id });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.categoryRepository.delete({ id });

    const result: OperationResultDto = {
      status: 'success',
      message: `Category with id: "${id}" deleted successfully`,
    };

    return result;
  }
}
