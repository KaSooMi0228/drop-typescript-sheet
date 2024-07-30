import { Pool } from "pg";
import { UserPermissions } from "../clay/server/api";
import { select, str } from "../clay/server/squel";

const { verify } = require("azure-ad-jwt-v2");

function verifyToken(token: string) {
  if (process.env.NODE_ENV !== "production") {
    return Promise.resolve({ preferred_username: "winstone@remdal.com" });
  }

  return new Promise((resolve, reject) => {
    verify(token, null, (err: any, result: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

export async function resolveUserName(token: string) {
  let ticket: any = await verifyToken(token);

  const resolved =
    process.env.OVERRIDE_USER ||
    (ticket.preferred_username === "winstone@remdal.com"
      ? "winstonewert@gmail.com"
      : ticket.preferred_username);

  return resolved;
}

export async function readUser(
  pool: Pool,
  username: string
): Promise<UserPermissions | null> {
  const result = await pool.query(
    select()
      .from("users")
      .where("account_email = ?", username)
      .where("active")
      .field("id")
      .field(
        select()
          .from(
            select()
              .from("roles")
              .field(str("unnest(roles.permissions)"), "permission")
              .where("roles.id = any(users.roles)"),
            "user_permissions"
          )
          .field(str("array_agg(permission)")),
        "permissions"
      )
      .toParam()
  );

  if (result.rows.length == 0) {
    return null;
  } else {
    return {
      id: result.rows[0].id,
      email: username,
      permissions: result.rows[0].permissions || [],
    };
  }
}

export async function resolveUser(pool: Pool, token: string) {
  console.log("RU", await resolveUserName(token));
  return await readUser(pool, await resolveUserName(token));
}
