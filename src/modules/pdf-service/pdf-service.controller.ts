// import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
// import { PdfServiceService } from './pdf-service.service';
// import { CreatePdfServiceDto } from './dto/create-pdf-service.dto';
// import { UpdatePdfServiceDto } from './dto/update-pdf-service.dto';

// @Controller('pdf-service')
// export class PdfServiceController {
//   constructor(private readonly pdfServiceService: PdfServiceService) {}

//   @Post()
//   create(@Body() createPdfServiceDto: CreatePdfServiceDto) {
//     return this.pdfServiceService.create(createPdfServiceDto);
//   }

//   @Get()
//   findAll() {
//     return this.pdfServiceService.findAll();
//   }

//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.pdfServiceService.findOne(+id);
//   }

//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updatePdfServiceDto: UpdatePdfServiceDto) {
//     return this.pdfServiceService.update(+id, updatePdfServiceDto);
//   }

//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.pdfServiceService.remove(+id);
//   }
// }
