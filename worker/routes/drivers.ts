import { Hono } from "hono";
import type { AppBindings } from "../types";
import { authMiddleware } from "../middleware/auth";
import { getDrivers } from "../usecases/get-drivers.usecase";
import { getAvailableDrivers } from "../usecases/get-available-drivers.usecase";
import { createD1SeasonRepository } from "../repositories/d1/season.d1";
import { createD1DriverRepository } from "../repositories/d1/driver.d1";
import { createD1PickRepository } from "../repositories/d1/pick.d1";
import { errorToHttpStatus, errorToMessage } from "../usecases/errors";

const drivers = new Hono<AppBindings>();

drivers.get("/", async (c) => {
  const seasonRepository = createD1SeasonRepository(c.env);
  const driverRepository = createD1DriverRepository(c.env);

  const result = await getDrivers({ seasonRepository, driverRepository });

  if (!result.ok) {
    return c.json(
      { error: errorToMessage(result.error) },
      errorToHttpStatus(result.error),
    );
  }

  return c.json({
    data: { drivers: result.value.drivers },
  });
});

drivers.get("/available", authMiddleware, async (c) => {
  const user = c.get("user");
  const seasonRepository = createD1SeasonRepository(c.env);
  const driverRepository = createD1DriverRepository(c.env);
  const pickRepository = createD1PickRepository(c.env);

  const result = await getAvailableDrivers(
    { seasonRepository, driverRepository, pickRepository },
    { userId: user.id },
  );

  if (!result.ok) {
    return c.json(
      { error: errorToMessage(result.error) },
      errorToHttpStatus(result.error),
    );
  }

  return c.json({
    data: {
      drivers: result.value.drivers,
      used_driver_ids: result.value.used_driver_ids,
    },
  });
});

export default drivers;
