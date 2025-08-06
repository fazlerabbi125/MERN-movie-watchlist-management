import { Module } from '@nestjs/common';
import { GenreController } from './genre.controller';

@Module({
    controllers: [GenreController],
    providers: [],
})
export class GenreModule {}
