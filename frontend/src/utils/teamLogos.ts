export const getTeamLogo = (teamName: string): string => {
  const logos: { [key: string]: string } = {
    'kolkata knight riders': 'kkr.png',
    'punjab kings': 'pbks.png',
    'rajasthan royals': 'rr.png',
    'chennai super kings': 'csk.jpeg',
    'delhi capitals': 'dc.jpeg',
    'gujarat titans': 'gt.jpeg',
    'royal challengers bengaluru': 'rcb.jpeg',
    'royal challengers bangalore': 'rcb.jpeg',
    'lucknow super giants': 'lsg.jpg',
    'mumbai indians': 'mi.jpg',
    'sunrisers hyderabad': 'srh.jpg'
  };

  const normalizedName = teamName.trim().toLowerCase();
  const logoFile = logos[normalizedName];
  return logoFile ? `/logo/${logoFile}` : `/logo/ipl.png`;
};
