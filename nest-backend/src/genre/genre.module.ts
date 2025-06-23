import { Module } from '@nestjs/common';
import { GenreController } from '@src/genre/genre.controller';

@Module({
    controllers: [GenreController],
    providers: [],
})
export class GenreModule {}
