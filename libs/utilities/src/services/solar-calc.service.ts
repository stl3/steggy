import { LATITUDE, LONGITUDE } from '@automagical/contracts/config';
import { LIB_UTILS } from '@automagical/contracts/constants';
import { ConfigService } from '@nestjs/config';
import dayjs from 'dayjs';
import { PinoLogger } from 'nestjs-pino';
import SolarCalc from 'solar-calc';
import SolarCalcType from 'solar-calc/types/solarCalc';

import { InjectLogger } from '../decorators';

export class SolarCalcService {
  // #region Object Properties

  private CALCULATOR;

  // #endregion Object Properties

  // #region Constructors

  constructor(
    @InjectLogger(SolarCalcService, LIB_UTILS)
    private readonly logger: PinoLogger,
    private readonly configService: ConfigService,
  ) {}

  // #endregion Constructors

  // #region Public Accessors

  public get IS_EVENING(): boolean {
    // Considered evening if the sun has set, or it's past 6PM
    const now = dayjs();
    return (
      now.isAfter(this.SOLAR_CALC.goldenHourStart) ||
      now.isAfter(now.startOf('day').add(12 + 6, 'hour')) ||
      now.isBefore(this.SOLAR_CALC.sunrise)
    );
  }

  public get SOLAR_CALC(): SolarCalcType {
    if (this.CALCULATOR) {
      return this.CALCULATOR;
    }
    setTimeout(() => (this.CALCULATOR = undefined), 1000 * 30);
    // typescript is wrong this time, it works as expected for me
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new SolarCalc(
      new Date(),
      // TODO: Populated via home assistant
      Number(this.configService.get(LATITUDE)),
      Number(this.configService.get(LONGITUDE)),
    );
  }

  // #endregion Public Accessors
}
