// This is an adapted version of your master data file for the web portal.

// We define a simplified type here as we don't have the Icon components.
interface WebDefaultGroupShotsCategory {
  id: string;
  displayName: string;
  isPredefined: boolean;
  items: { id: string; name: string; notes?: string; checked?: boolean }[];
}

export const DEFAULT_GROUP_SHOT_CATEGORIES: WebDefaultGroupShotsCategory[] = [
    {
        id: 'group_shot_cat_family',
        displayName: 'Family',
        isPredefined: true,
        items: [
            {id:'gsf01', name: 'P1 parents', notes: 'Couple posed with Partner 1s parents', checked: false },
            {id:'gsf02', name: 'P2 parents', notes: 'Couple posed with Partner 2s parents', checked: false },
            {id:'gsf03', name: 'All parents', notes: 'Couple with both sets of parents together', checked: false },
            {id:'gsf04', name: 'P1 immediate fam', notes: 'Partner 1s parents and siblings with the couple', checked: false },
            {id:'gsf05', name: 'P2 immediate fam', notes: 'Partner 2s parents and siblings with the couple', checked: false },
            {id:'gsf06', name: 'All immediate fam', notes: 'Both families parents and siblings with couple', checked: false },
            {id:'gsf07', name: 'All siblings', notes: 'Couple with siblings from both families', checked: false },
            {id:'gsf08', name: 'Grandparents', notes: 'Couple with each side grandparents separately', checked: false },
            {id:'gsf09', name: 'Generations shot', notes: 'Include couple, parents, and grandparents in frame', checked: false },
        ]
    },
    {
        id: 'group_shot_cat_wedding_party',
        displayName: 'Wedding Party',
        isPredefined: true,
        items: [
            {id:'gswp01', name: 'Full wedding party', notes: 'Couple posed with entire wedding party together', checked: false },
            {id:'gswp02', name: 'P1 attendants', notes: 'Partner 1 with their bridesmaids or groomsmen', checked: false },
            {id:'gswp03', name: 'P2 attendants', notes: 'Partner 2 with their bridesmaids or groomsmen', checked: false },
            {id:'gswp04', name: 'P1 & Maid/Best Man', notes: 'Partner 1 with Maid of Honour or Partner 2 with Best Man', checked: false },
            {id:'gswp05', name: 'All attendants', notes: 'All bridesmaids and groomsmen grouped together', checked: false },
            {id:'gswp06', name: 'Flower girls/ring bearers', notes: 'Couple with flower girls and ring bearers posed', checked: false },
            {id:'gswp07', name: 'Couple with ushers', notes: 'Group shot with couple and their ushers', checked: false },            
          ]
    },
    {
        id: 'group_shot_cat_extended_family',
        displayName: 'Extended Family',
        isPredefined: true,
        items: [
            {id:'gsxf01', name: 'P1 extended family', notes: 'Couple posed with Partner 1s extended family', checked: false },
            {id:'gsxf02', name: 'P2 extended family', notes: 'Couple posed with Partner 2s extended family', checked: false },
            {id:'gsxf03', name: 'All aunts & uncles', notes: 'Couple with all aunts and uncles together', checked: false },
            {id:'gsxf04', name: 'All cousins', notes: 'Group shot of couple with all cousins present', checked: false },
        ]
    },
    {
        id: 'group_shot_cat_friends',
        displayName: 'Friends',
        isPredefined: true,
        items: [
            {id:'gsfr01', name: 'Close friends', notes: 'Couple posed with their closest friends', checked: false },
            {id:'gsfr02', name: 'University friends', notes: 'Couple with friends from university or college', checked: false },
            {id:'gsfr03', name: 'School friends', notes: 'Couple with friends from school days', checked: false },
            {id:'gsfr04', name: 'Work friends', notes: 'Couple posed with colleagues and work friends', checked: false },
        ]
    },
    {
        id: 'group_shot_cat_fun',
        displayName: 'Fun',
        isPredefined: true,
        items: [
            {id:'gsfu01', name: 'Party lifting couple', notes: 'Wedding party lifting the couple joyfully', checked: false },
            {id:'gsfu02', name: 'Guest tunnel', notes: 'Guests forming a tunnel or archway for couple', checked: false },
            {id:'gsfu03', name: 'Silly face shot', notes: 'Fun candid with wedding party making silly faces', checked: false },
            {id:'gsfu04', name: 'Confetti toss', notes: 'Guests throwing confetti around the couple', checked: false },
            {id:'gsfu05', name: 'Hobby group', notes: 'Couple with guests from a shared hobby or club', checked: false },
        ]
    }
];