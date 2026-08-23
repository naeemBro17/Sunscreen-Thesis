import { useContext } from "react";
import { AppContext } from "../context/AppContext";

const COLS = ["au", "jp", "eu", "kr", "in"];
const COL_TINT_CLASS = {
  au: "reg-col-au",
  jp: "reg-col-jp",
  eu: "reg-col-eu",
  kr: "reg-col-kr",
  in: "reg-col-in",
};
const ROWS = [1, 2, 3, 4, 5, 6];

function RegTable({ section }) {
  const { t } = useContext(AppContext);

  return (
    <div className="reg-table-wrap">
      <table className="reg-table">
        <thead>
          <tr>
            <th>{t[`${section}.tbl.criterion`]}</th>
            {COLS.map((col) => (
              <th key={col} className={COL_TINT_CLASS[col]}>{t[`${section}.tbl.${col}`]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((n) => (
            <tr key={n}>
              <td className="reg-table-label">{t[`${section}.r${n}.label`]}</td>
              {COLS.map((col) => {
                const sub = t[`${section}.r${n}.${col}Sub`];
                return (
                  <td key={col} className={COL_TINT_CLASS[col]}>
                    {t[`${section}.r${n}.${col}`]}
                    {sub && <span className="reg-table-sub">{sub}</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {t[`${section}.caption`] && <p className="reg-table-caption">{t[`${section}.caption`]}</p>}
    </div>
  );
}

export default RegTable;
